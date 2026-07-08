// playwright.config.js — TC 하니스 설정 (RED/GREEN 판정은 _tools/red_run.sh 가 수행).
// 설치 위치: .claude/specs/tc/tests/playwright.config.js
// BASE_URL 은 red_run.sh 가 target 별로 주입:
//   app  → http://127.0.0.1:{port} (코드 부재 빈 셸 정적 서버 — RED)
//   real → 구동 중인 실앱 (예: http://localhost:3000 — GREEN)
// testDir '.' = tc/tests 전체: 단위 *.spec.js + _structure.spec.js + specs/e2e/**.
// RED 시점엔 e2e spec 이 존재하지 않으므로 단위+구조만 실행된다.
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
