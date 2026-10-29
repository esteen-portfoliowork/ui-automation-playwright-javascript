const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  reporter: [
    ['html'],
    ['list'],
    ['allure-playwright']
  ],

  use: {
    headless: true,

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'on-first-retry'
  }
});