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
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot settings - すべてのテストでスクリーンショットを保存 */
    screenshot: 'on', // 成功・失敗問わずスクリーンショットを保存
    
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
    // 常に開発サーバーを使用（認証問題の調査のため）
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // CI環境では新しいサーバーを起動
    timeout: 180000, // 3分間待機（CI環境での安定性向上）
    env: {
      NODE_ENV: 'development', // 常に開発モードで実行
      DATABASE_URL: process.env.CI ? 'file:./e2e-test.db' : process.env.DATABASE_URL,
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: process.env.CI ? 'test-secret-for-e2e-tests' : process.env.NEXTAUTH_SECRET,
    },
  },
})