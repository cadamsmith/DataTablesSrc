import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // Only look for tests in the modern tests directory
  testIgnore: [
    '**/old_tests/**', // Ignore all tests in old_tests
  ],
});
