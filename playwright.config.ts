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
  timeout: 30000,
  /* Expect timeout */
  expect: {
    timeout: 5000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot settings - すべてのテストでスクリーンショットを保存 */
    screenshot: process.env.CI ? 'on' : 'only-on-failure',
    
    /* Video settings */
    video: process.env.CI ? 'retain-on-failure' : 'retain-on-failure',
    
    /* Action timeout */
    actionTimeout: 15000, // Docker環境では少し長めに
    
    /* Navigation timeout */
    navigationTimeout: 45000, // Docker環境では少し長めに
    
    /* Docker環境での設定 */
    ...(process.env.CI && {
      // CIでは安定性を重視
      launchOptions: {
        slowMo: 100, // 操作間に100msの遅延
      },
    }),
  },

  /* Configure projects for major browsers */
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

    // CI環境では他のブラウザはスキップ（安定性重視）
    ...(process.env.CI ? [] : [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },

      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ]),
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // CI環境ではプロダクションサーバーを使用、ローカルでは開発サーバー
    command: process.env.CI ? 'npm start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // 既存のサーバーを使用
    timeout: 120000, // 2分間待機
    env: {
      NODE_ENV: process.env.CI ? 'production' : 'development',
    },
  },
})