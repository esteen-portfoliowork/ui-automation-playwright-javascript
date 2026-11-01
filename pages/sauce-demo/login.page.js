// Arrange Alphabetically
// Keywords for SauceDemo - Login Page
import { BasePage } from '../base.page.js';
import { LoginLocators } from '../../locators/sauceDemo/login.locator.js';

export class LoginPage extends BasePage {
    constructor(page) {
        super(page);
    }

    async login(username, password) {
        await this.fill(LoginLocators.usernameInput, username);
        await this.fill(LoginLocators.passwordInput, password);
        await this.click(LoginLocators.loginButton);
    }

    async getErrorMessage() {
        return await this.getText(LoginLocators.errorMessage);
    }
}