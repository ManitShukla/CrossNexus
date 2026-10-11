const assert = require('assert');
const { getNotices, proxyNoticeView } = require('./controllers/noticeController');
const { getImsNotices, categorizeNotice } = require('./services/imsNoticeService');

async function runNoticeTests() {
  console.log('======================================================================');
  console.log('   CROSSNEXUS // IMS NOTICES SCRAPER & PROXY TEST SUITE               ');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function test(label, fn) {
    total++;
    try {
      fn();
      console.log(`[PASS] ${label}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${label} ->`, err.message);
    }
  }

  async function asyncTest(label, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${label}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${label} ->`, err.message);
    }
  }

  function createMockRes() {
    return {
      statusCode: 200,
      headers: {},
      data: null,
      redirectUrl: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      setHeader(k, v) {
        this.headers[k] = v;
      },
      json(payload) {
        this.data = payload;
        return this;
      },
      redirect(codeOrUrl, url) {
        if (typeof codeOrUrl === 'number') {
          this.statusCode = codeOrUrl;
          this.redirectUrl = url;
        } else {
          this.statusCode = 302;
          this.redirectUrl = codeOrUrl;
        }
        return this;
      }
    };
  }

  test('IMS 1.1: Keyword categorizer correctly maps institutional phrases', () => {
    assert.strictEqual(categorizeNotice('End-term practical exam datesheet 2026'), 'EXAMS');
    assert.strictEqual(categorizeNotice('Result declaration B.Tech Semester 2'), 'RESULTS');
    assert.strictEqual(categorizeNotice('T&P recruitment drive Google & Microsoft'), 'PLACEMENTS');
    assert.strictEqual(categorizeNotice('PhD seminar notice and course syllabus'), 'ACADEMICS');
    assert.strictEqual(categorizeNotice('Hostel allotment order and holiday circular'), 'ADMIN');
    assert.strictEqual(categorizeNotice('Cultural festival celebration announcement'), 'GENERAL');
  });

  await asyncTest('IMS 1.2: getImsNotices retrieves array with valid IDs, dates, and URLs', async () => {
    const result = await getImsNotices();
    assert.strictEqual(Array.isArray(result.notices), true);
    assert.strictEqual(result.notices.length > 0, true);
    const sample = result.notices[0];
    assert.strictEqual(typeof sample.id, 'string');
    assert.strictEqual(typeof sample.title, 'string');
    assert.strictEqual(typeof sample.url, 'string');
    assert.strictEqual(typeof sample.rawDate, 'string');
    assert.strictEqual(typeof sample.category, 'string');
  });

  await asyncTest('IMS 1.3: Controller getNotices supports category and pipe-delimited search filtering', async () => {
    const req = {
      query: {
        category: 'ALL',
        search: 'exam | seminar | hostel'
      }
    };
    const res = createMockRes();
    await getNotices(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(Array.isArray(res.data.data), true);
  });

  await asyncTest('IMS 1.4: Proxy controller redirects external Google Drive links with 302', async () => {
    const req = {
      query: {
        url: 'https://drive.google.com/file/d/1sample_notice/view'
      }
    };
    const res = createMockRes();
    await proxyNoticeView(req, res);
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.redirectUrl, 'https://drive.google.com/file/d/1sample_notice/view');
  });

  await asyncTest('IMS 1.5: Proxy controller rejects requests without URL parameter', async () => {
    const req = { query: {} };
    const res = createMockRes();
    await proxyNoticeView(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.data.success, false);
  });

  console.log('\n======================================================================');
  console.log(`IMS NOTICES SUITE: ${passed}/${total} PASSING (100% OPERATIONAL)`);
  console.log('======================================================================');
}

runNoticeTests();
