const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const IMS_URL = 'https://www.imsnsit.org/imsnsit/notifications.php';
const IMS_BASE = 'https://www.imsnsit.org/imsnsit/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 15-minute in-memory cache
const CACHE_TTL_MS = 15 * 60 * 1000;
let cachedNotices = null;
let lastFetchTimestamp = 0;

// High-fidelity fallback seed notices in case IMS portal is unreachable or times out
const FALLBACK_SEED_NOTICES = [
  {
    id: 'ims_seed_01',
    title: 'INAUGURATION OF YASHASWINI GIRLS HOSTEL (EAST CAMPUS)',
    rawDate: '09-10-2026',
    isoDate: '2026-10-09',
    url: 'https://www.imsnsit.org/imsnsit/notifications.php',
    isExternal: false,
    publisher: 'SUNITA, ASSISTANT PROFESSOR, EAST CAMPUS',
    category: 'ADMIN'
  },
  {
    id: 'ims_seed_02',
    title: 'PhD Pre-Submission Seminar Notice - Department of Mechanical Engineering',
    rawDate: '07-10-2026',
    isoDate: '2026-10-07',
    url: 'https://www.imsnsit.org/imsnsit/notifications.php',
    isExternal: false,
    publisher: 'UMANG SONI, ASSOCIATE PROFESSOR, MECHANICAL ENGINEERING',
    category: 'ACADEMICS'
  },
  {
    id: 'ims_seed_03',
    title: 'MBA Major Project Evaluation & Viva Voce Schedule 2026-27',
    rawDate: '07-10-2026',
    isoDate: '2026-10-07',
    url: 'https://www.imsnsit.org/imsnsit/notifications.php',
    isExternal: false,
    publisher: 'AASHIMA, ASSISTANT PROFESSOR, MANAGEMENT STUDIES',
    category: 'ACADEMICS'
  },
  {
    id: 'ims_seed_04',
    title: 'End-Term Examination Datesheet Odd Semester B.Tech / M.Tech (November-December 2026)',
    rawDate: '05-10-2026',
    isoDate: '2026-10-05',
    url: 'https://www.imsnsit.org/imsnsit/notifications.php',
    isExternal: false,
    publisher: 'CONTROLLER OF EXAMINATIONS, NSUT MAIN CAMPUS',
    category: 'EXAMS'
  },
  {
    id: 'ims_seed_05',
    title: 'Training & Placement Cell: Campus Recruitment Drive for Microsoft, Google & Atlassian',
    rawDate: '04-10-2026',
    isoDate: '2026-10-04',
    url: 'https://drive.google.com/file/d/1example_tnp_drive_notice/view',
    isExternal: true,
    publisher: 'PROF. SUJATA SENGAR, HEAD T&P CELL',
    category: 'PLACEMENTS'
  },
  {
    id: 'ims_seed_06',
    title: 'Result Declaration: B.Tech Even Semester Regular & Re-appear Examination 2026',
    rawDate: '01-10-2026',
    isoDate: '2026-10-01',
    url: 'https://www.imsnsit.org/imsnsit/notifications.php',
    isExternal: false,
    publisher: 'EXAMINATION CELL, NSUT',
    category: 'RESULTS'
  },
  {
    id: 'ims_seed_07',
    title: 'Fee Payment & Semester Registration Guidelines for Academic Year 2026-27',
    rawDate: '28-09-2026',
    isoDate: '2026-09-28',
    url: 'https://www.imsnsit.org/imsnsit/notifications.php',
    isExternal: false,
    publisher: 'DEAN ACADEMIC AFFAIRS, NSUT',
    category: 'ACADEMICS'
  },
  {
    id: 'ims_seed_08',
    title: 'Office Order: Revised Guidelines for Allotment of Student Activity Centre & Nescii Lawns',
    rawDate: '25-09-2026',
    isoDate: '2026-09-25',
    url: 'https://www.imsnsit.org/imsnsit/notifications.php',
    isExternal: false,
    publisher: 'REGISTRAR, NETAJI SUBHAS UNIVERSITY OF TECHNOLOGY',
    category: 'ADMIN'
  }
];

/**
 * Categorize a notice by matching title text against institutional keywords
 */
function categorizeNotice(title) {
  const text = (title || '').toUpperCase();

  if (/EXAM|DATESHEET|DATE-SHEET|MID-TERM|END-TERM|PRACTICAL|VIVA|BACKLOG|RE-APPEAR/.test(text)) {
    return 'EXAMS';
  }
  if (/RESULT|GRADE|SCORECARD|CGPA|SGPA|MODERATION/.test(text)) {
    return 'RESULTS';
  }
  if (/TNP|PLACEMENT|INTERNSHIP|RECRUIT|INTERVIEW|CTC|OFFER|COMPANY/.test(text)) {
    return 'PLACEMENTS';
  }
  if (/ACADEMIC|REGISTRATION|SYLLABUS|CURRICULUM|PHD|SEMINAR|LECTURE|PROJECT|COURSE|ADMISSION|FEE/.test(text)) {
    return 'ACADEMICS';
  }
  if (/HOSTEL|MESS|INAUGURATION|ADMIN|ORDER|CIRCULAR|HOLIDAY|COMMITTEE|DISCIPLINE/.test(text)) {
    return 'ADMIN';
  }
  return 'GENERAL';
}

/**
 * Convert string dates (DD-MM-YYYY or DD/MM/YYYY) to standard ISO format YYYY-MM-DD
 */
function parseDateToIso(rawDateStr) {
  if (!rawDateStr) return new Date().toISOString().split('T')[0];
  const cleaned = rawDateStr.replace(/[./]/g, '-').trim();
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];
    if (day.length === 4) {
      // already YYYY-MM-DD
      return `${day}-${month.padStart(2, '0')}-${year.padStart(2, '0')}`;
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Scrape IMS notifications page and extract clean notice objects
 */
async function scrapeImsNotices() {
  const response = await axios.get(IMS_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    },
    timeout: 12000
  });

  const $ = cheerio.load(response.data);
  const notices = [];

  $('tr').each((i, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 2) return;

    const rowText = $(tr).text().replace(/\s+/g, ' ').trim();
    const aTag = $(tr).find('a').first();
    if (!aTag.length) return;

    let href = (aTag.attr('href') || '').trim();
    if (!href) return;

    // Resolve relative URL
    if (href.startsWith('plum_url.php') || href.startsWith('./plum_url.php')) {
      href = IMS_BASE + href.replace(/^\.\//, '');
    } else if (!href.startsWith('http')) {
      href = IMS_BASE + href;
    }

    // Clean title
    let title = aTag.text().trim();
    if (!title) {
      title = $(tds[0]).text().trim();
    }
    // Clean redundant prefixes/newlines
    title = title.replace(/\s+/g, ' ').trim();

    // Extract date
    let rawDate = '';
    const dateMatch = rowText.match(/\b\d{2}[-/.]\d{2}[-/.]\d{4}\b/);
    if (dateMatch) {
      rawDate = dateMatch[0].replace(/[./]/g, '-');
    } else {
      rawDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    }
    const isoDate = parseDateToIso(rawDate);

    // Extract publisher if available
    let publisher = 'NSUT ADMINISTRATION';
    const pubMatch = rowText.match(/Published By:\s*([^]+?)(?=$|<)/i);
    if (pubMatch && pubMatch[1]) {
      publisher = pubMatch[1].trim();
    }

    const isExternal = href.includes('drive.google.com') || 
                       href.includes('docs.google.com') || 
                       !href.includes('imsnsit.org');

    const category = categorizeNotice(title);

    // Deterministic hash ID based on title + date
    const id = crypto.createHash('md5').update(`${title}_${rawDate}`).digest('hex').slice(0, 16);

    notices.push({
      id,
      title,
      rawDate,
      isoDate,
      url: href,
      isExternal,
      publisher,
      category
    });
  });

  return notices;
}

/**
 * Fetch notices with in-memory caching (15-min TTL) and graceful error recovery
 */
async function getImsNotices({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && cachedNotices && (now - lastFetchTimestamp < CACHE_TTL_MS)) {
    return {
      notices: cachedNotices,
      source: 'CACHE',
      cachedAt: new Date(lastFetchTimestamp).toISOString()
    };
  }

  try {
    const scraped = await scrapeImsNotices();
    if (scraped && scraped.length > 0) {
      cachedNotices = scraped;
      lastFetchTimestamp = now;
      console.log(`[IMS_SCRAPER] Successfully refreshed ${scraped.length} notices from ${IMS_URL}`);
      return {
        notices: cachedNotices,
        source: 'LIVE',
        cachedAt: new Date(lastFetchTimestamp).toISOString()
      };
    }
    throw new Error('Scraper parsed 0 notices.');
  } catch (err) {
    console.warn(`[IMS_SCRAPER_WARNING] Live scrape failed: ${err.message}. Engaging fallback cache.`);
    if (cachedNotices && cachedNotices.length > 0) {
      return {
        notices: cachedNotices,
        source: 'STALE_CACHE',
        cachedAt: new Date(lastFetchTimestamp).toISOString()
      };
    }
    // Return fallback seed notices
    cachedNotices = FALLBACK_SEED_NOTICES;
    lastFetchTimestamp = now;
    return {
      notices: cachedNotices,
      source: 'FALLBACK_SEED',
      cachedAt: new Date(lastFetchTimestamp).toISOString()
    };
  }
}

module.exports = {
  getImsNotices,
  categorizeNotice,
  IMS_URL,
  USER_AGENT
};
