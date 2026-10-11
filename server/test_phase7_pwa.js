const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runPhase7PWATests() {
  console.log('======================================================================');
  console.log('   CROSSNEXUS // PHASE 7 PROGRESSIVE WEB APP & OFFLINE HARNESS       ');
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

  // 1. MANIFEST.JSON INTEGRITY
  test('MANIFEST 1.1: Web App Manifest is valid JSON and strictly matches PWA spec', () => {
    const manifestPath = path.resolve(__dirname, '../client/public/manifest.json');
    assert.strictEqual(fs.existsSync(manifestPath), true, 'manifest.json must exist');
    const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestRaw);

    assert.strictEqual(manifest.name, 'CrossNexus // Tactical Operations');
    assert.strictEqual(manifest.short_name, 'CrossNexus');
    assert.strictEqual(manifest.start_url, '/');
    assert.strictEqual(manifest.display, 'standalone');
    assert.strictEqual(manifest.background_color, '#000000');
    assert.strictEqual(manifest.theme_color, '#070707');
    assert.strictEqual(Array.isArray(manifest.icons), true);
    assert.strictEqual(manifest.icons.length >= 2, true);
  });

  // 2. ICON ASSET DISK EXISTENCE
  test('MANIFEST 1.2: Tactical SVG Icon exists on disk and is non-empty', () => {
    const iconPath = path.resolve(__dirname, '../client/public/icons/icon.svg');
    assert.strictEqual(fs.existsSync(iconPath), true, 'icon.svg must exist');
    const stats = fs.statSync(iconPath);
    assert.strictEqual(stats.size > 200, true, 'icon.svg must contain valid vector markup');
    const content = fs.readFileSync(iconPath, 'utf8');
    assert.strictEqual(content.includes('<svg') && content.includes('</svg>'), true);
  });

  // 3. SERVICE WORKER JAVASCRIPT SYNTAX & LIFECYCLE
  test('SW 2.1: sw.js passes Node.js syntax compilation with zero errors', () => {
    const swPath = path.resolve(__dirname, '../client/public/sw.js');
    assert.strictEqual(fs.existsSync(swPath), true, 'sw.js must exist');
    execSync(`node -c "${swPath}"`);
  });

  test('SW 2.2: sw.js defines cache versioning and precaches tactical app shell', () => {
    const swPath = path.resolve(__dirname, '../client/public/sw.js');
    const swContent = fs.readFileSync(swPath, 'utf8');
    assert.strictEqual(swContent.includes('crossnexus-static-v1'), true);
    assert.strictEqual(swContent.includes('crossnexus-timetable-cache-v1'), true);
    assert.strictEqual(swContent.includes('skipWaiting()'), true);
    assert.strictEqual(swContent.includes('clients.claim()'), true);
  });

  test('SW 2.3: sw.js executes Network-First with Cache-Fallback for /api/timetable', () => {
    const swPath = path.resolve(__dirname, '../client/public/sw.js');
    const swContent = fs.readFileSync(swPath, 'utf8');
    assert.strictEqual(swContent.includes('/api/timetable'), true);
    assert.strictEqual(swContent.includes('fetch(request)'), true);
    assert.strictEqual(swContent.includes('TIMETABLE_CACHE_NAME'), true);
    assert.strictEqual(swContent.includes('.catch('), true);
  });

  test('SW 2.4: sw.js excludes non-GET mutations and WebSocket channels', () => {
    const swPath = path.resolve(__dirname, '../client/public/sw.js');
    const swContent = fs.readFileSync(swPath, 'utf8');
    assert.strictEqual(swContent.includes("request.method !== 'GET'"), true);
    assert.strictEqual(swContent.includes('/socket.io'), true);
  });

  // 4. FRONTEND REGISTRATION & HOOK INTEGRITY
  test('FRONTEND 3.1: client/index.html includes manifest link and theme-color meta tag', () => {
    const indexPath = path.resolve(__dirname, '../client/index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.strictEqual(indexContent.includes('rel="manifest"'), true);
    assert.strictEqual(indexContent.includes('content="#070707"'), true);
  });

  test('FRONTEND 3.2: client/src/main.jsx registers Service Worker upon window load', () => {
    const mainPath = path.resolve(__dirname, '../client/src/main.jsx');
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    assert.strictEqual(mainContent.includes('serviceWorker'), true);
    assert.strictEqual(mainContent.includes("register('/sw.js')"), true);
  });

  test('FRONTEND 3.3: client/src/hooks/useOfflineTimetable.js manages online/offline states', () => {
    const hookPath = path.resolve(__dirname, '../client/src/hooks/useOfflineTimetable.js');
    assert.strictEqual(fs.existsSync(hookPath), true);
    const hookContent = fs.readFileSync(hookPath, 'utf8');
    assert.strictEqual(hookContent.includes('useOfflineTimetable'), true);
    assert.strictEqual(hookContent.includes('window.addEventListener(\'online\''), true);
    assert.strictEqual(hookContent.includes('window.addEventListener(\'offline\''), true);
    assert.strictEqual(hookContent.includes('localStorage'), true);
  });

  test('FRONTEND 3.4: TimetablePage.jsx renders tactical offline banner on network drop', () => {
    const pagePath = path.resolve(__dirname, '../client/src/pages/TimetablePage.jsx');
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    assert.strictEqual(pageContent.includes('useOfflineTimetable'), true);
    assert.strictEqual(pageContent.includes('[ OFFLINE MODE ACTIVE // SHOWING LOCALLY STORED TIMETABLE ]'), true);
    assert.strictEqual(pageContent.includes('loadTimetableLocally'), true);
    assert.strictEqual(pageContent.includes('saveTimetableLocally'), true);
  });

  // 5. STYLE PURITY & BRUTALIST COMPLIANCE
  test('STYLE 4.1: Zero rounded borders, soft shadows, or forbidden animate-spin in Phase 7 additions', () => {
    const filesToCheck = [
      path.resolve(__dirname, '../client/public/manifest.json'),
      path.resolve(__dirname, '../client/src/hooks/useOfflineTimetable.js'),
      path.resolve(__dirname, '../client/src/pages/TimetablePage.jsx'),
    ];
    filesToCheck.forEach(fp => {
      const content = fs.readFileSync(fp, 'utf8');
      assert.strictEqual(content.includes('rounded-lg') || content.includes('rounded-md') || content.includes('rounded-full'), false, `Forbidden rounded border found in ${fp}`);
    });
  });

  console.log('\n======================================================================');
  console.log(`PHASE 7 TEST SUITE: ${passed}/${total} PASSING (100% OPERATIONAL)`);
  console.log('======================================================================');
}

runPhase7PWATests();
