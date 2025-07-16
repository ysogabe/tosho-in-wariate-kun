import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [
    ['github'],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ] : 'html',
  /* Global test timeout */
  timeout: process.env.CI ? 45000 : 30000, // CI環境では45秒に延長
  /* Expect timeout */
  expect: {
    timeout: process.env.CI ? 10000 : 5000, // CI環境では10秒に延長
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3100',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot settings - 成功時も含めて全テストでスクリーンショット保存 */
    screenshot: 'on',
    
    /* Video settings */
    video: 'retain-on-failure',
    
    /* Action timeout */
    actionTimeout: process.env.CI ? 20000 : 15000, // CI環境では20秒に延長
    
    /* Navigation timeout */
    navigationTimeout: process.env.CI ? 60000 : 45000, // CI環境では60秒に延長
    
    /* Docker環境での設定 */
    ...(process.env.CI && {
      // CIでは安定性を重視
      launchOptions: {
        slowMo: 250, // 操作間に250msの遅延（CI環境での安定性向上）
      },
    }),
  },

  /* Configure projects for major browsers - Chromium only */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // CI環境での安定性を向上させるためのオプション
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--allow-running-insecure-content',
            // Docker環境での最適化
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
        },
      },
    },
  ],

  /* Run production server for E2E tests */
  webServer: {
    // プロダクションビルド + サーバーを使用（本番環境と同等）
    command: 'NEXT_PUBLIC_E2E_AUTH_BYPASS=true npm run build && PORT=3100 NEXT_PUBLIC_E2E_AUTH_BYPASS=true npm run start',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: {
      NODE_ENV: 'production', // プロダクション環境でのE2E
      NEXT_PUBLIC_E2E_AUTH_BYPASS: 'true', // クライアントサイドで参照可能
      DATABASE_URL: process.env.CI ? 'file:./e2e-test.db' : process.env.DATABASE_URL,
      NEXTAUTH_URL: 'http://localhost:3100',
      NEXTAUTH_SECRET: process.env.CI ? 'test-secret-for-e2e-tests' : process.env.NEXTAUTH_SECRET,
      PORT: '3100',
    },
  },
})