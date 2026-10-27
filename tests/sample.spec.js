import { test, expect } from '@playwright/test';

test('Successful Test', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');

//   await loginPage.login(
//     'standard_user',
//     'secret_sauce'
//   );

//   await expect(
//     loginPage.productTitle
//   ).toHaveText('Products');
});