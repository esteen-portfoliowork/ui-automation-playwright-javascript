// Arrange Alphabetically
// Keywords for SauceDemo - Login Page
import { BasePage } from '../base.page.js';
import { AppUrls } from '../../config/app.urls.js';
import { LoginLocators } from '../../locators/sauce-demo/login.locator.js';
import { users } from '../../data/sauce-demo/auth.data.js';

export class LoginPage extends BasePage {
    constructor(page) {
        super(page);
    }

    async login(username='', password='') {
        await this.fill(
            LoginLocators.usernameInput, username
        );
        await this.fill(
            LoginLocators.passwordInput, password);
        await this.click(
            LoginLocators.loginButton);
    }

    async loginAsStandardUser() {
        await this.login(
            users.standard.username,
            users.standard.password
        );
    }

    async navigateToLogin() {
        await this.page.goto(
            AppUrls.sauceDemo.login
        );
    }

    async getErrorMessage() {
        return await this.getText(
            LoginLocators.errorMessage);
    }
}