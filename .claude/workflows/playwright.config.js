// playwright.config.js — TC 하니스 설정 (RED/GREEN 판정은 _tools/red_run.sh 가 수행).
// BASE_URL 은 red_run.sh 가 target 별로 주입:
//   app  → http://127.0.0.1:{port} (미구현/빈 대상 정적 서버)
//   mock → http://127.0.0.1:{port} (prd/html 목업 정적 서버)
//   real → 구동 중인 실앱 (예: next dev, http://localhost:3000)
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  fullyParallel: true,
  workers: 4,
  retries: 0,
  timeout: 15000,
  reporter: [
    ['line'],
    ['json', { outputFile: '../../_data/manifests/playwright_report.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8931',
    headless: true,
    actionTimeout: 2500,
    navigationTimeout: 8000,
    ignoreHTTPSErrors: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  expect: { timeout: 2500 },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
