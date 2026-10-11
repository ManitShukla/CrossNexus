const axios = require('axios');
const { getImsNotices, IMS_URL, USER_AGENT } = require('../services/imsNoticeService');

/**
 * Controller: GET /api/notices
 * Returns active circulars scraped from IMS NSIT with query filtering
 */
async function getNotices(req, res) {
  try {
    const forceRefresh = req.query.refresh === 'true' || req.query.refresh === '1';
    const { notices, source, cachedAt } = await getImsNotices({ forceRefresh });

    let filtered = [...notices];

    // Category filter
    const category = (req.query.category || '').trim().toUpperCase();
    if (category && category !== 'ALL') {
      filtered = filtered.filter((n) => n.category === category);
    }

    // Search query filter (supports pipe-delimited search e.g. "exam | datesheet | 2026")
    const search = (req.query.search || '').trim();
    if (search) {
      const pipeTerms = search.split('|').map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (pipeTerms.length > 0) {
        filtered = filtered.filter((n) => {
          const haystack = `${n.title} ${n.publisher} ${n.rawDate} ${n.isoDate} ${n.category}`.toLowerCase();
          return pipeTerms.some((term) => {
            const subWords = term.split(/\s+/).filter(Boolean);
            return subWords.every((word) => haystack.includes(word));
          });
        });
      }
    }

    return res.status(200).json({
      success: true,
      source,
      cachedAt,
      total: notices.length,
      count: filtered.length,
      data: filtered,
    });
  } catch (err) {
    console.error('[NOTICE_CONTROLLER_ERR]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve IMS notices.',
      error: err.message,
    });
  }
}

/**
 * Controller: GET /api/notices/view
 * Authenticated / direct streaming proxy that injects the required Referer header
 * to bypass "Invalid operation232" when fetching obfuscated plum_url.php links.
 */
async function proxyNoticeView(req, res) {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing target notice URL parameter (?url=...).',
      });
    }

    const targetUrl = decodeURIComponent(rawUrl.trim());

    // External hosts (Google Drive, Docs, etc.) simply redirect directly
    if (
      targetUrl.includes('drive.google.com') ||
      targetUrl.includes('docs.google.com') ||
      !targetUrl.includes('imsnsit.org')
    ) {
      return res.redirect(302, targetUrl);
    }

    // IMS portal obfuscated link: stream with forged Referer header
    const response = await axios.get(targetUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': IMS_URL,
        'Accept': 'application/pdf,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 20000,
    });

    const contentType = response.headers['content-type'] || 'application/pdf';

    res.status(response.status || 200);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline; filename="ims_notice.pdf"');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    response.data.on('error', (streamErr) => {
      console.error('[STREAM_PIPING_ERR]', streamErr);
      if (!res.headersSent) {
        res.status(502).end('Error streaming document from upstream IMS server.');
      }
    });

    response.data.pipe(res);
  } catch (err) {
    console.error('[NOTICE_PROXY_ERR]', err.message);
    if (!res.headersSent) {
      return res.status(502).json({
        success: false,
        message: 'Failed to proxy IMS document from upstream server.',
        error: err.message,
      });
    }
  }
}

module.exports = {
  getNotices,
  proxyNoticeView,
};
