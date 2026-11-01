// Arrange Alphabetically
// Validations for SauceDemo - Login Page
import { expect } from '@playwright/test';
import { LoginLocators } from '../../locators/sauce-demo/login.locator.js';
import { AppUrls } from '../../config/app.urls.js';

export class LoginValidation {
    constructor(page) {
        this.page = page;
    }

    async validateErrorMessage(expectedMessage) {
        const errorMessage = this.page.locator(
            LoginLocators.errorMessage
        );

        await expect(errorMessage).toBeVisible();

        await expect(errorMessage)
            .toContainText(expectedMessage);
    }

    async validateLoginPageDisplayed() {
        await expect(
            this.page.locator(
                LoginLocators.usernameInput
            )
        ).toBeVisible();

        await expect(
            this.page.locator(
                LoginLocators.passwordInput
            )
        ).toBeVisible();

        await expect(
            this.page.locator(
                LoginLocators.loginButton
            )
        ).toBeVisible();

        await expect(this.page)
            .toHaveURL(AppUrls.sauceDemo.login);
    }

    async validateUserLoggedOut() {

        await this.validateLoginPageDisplayed();

        await expect(this.page)
            .not
            .toHaveURL(/inventory/);

    }

    async validateUserRemainsOnLoginPage() {
        await expect(this.page)
            .not
            .toHaveURL(/inventory/);
    }
}