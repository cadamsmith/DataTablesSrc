import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // Only look for tests in the modern tests directory
  testIgnore: [
    '**/old_tests/**', // Ignore all tests in old_tests
  ],
  webServer: {
    command: 'http-server -c-1 -p 8080 . > /dev/null 2>&1',
    port: 8080,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:8080',
  },
});
