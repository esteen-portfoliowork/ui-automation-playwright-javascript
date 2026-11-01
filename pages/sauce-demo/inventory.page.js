// Arrange Alphabetically
// Keywords for SauceDemo - Inventory Page
import { BasePage } from '../base.page.js';
import { InventoryLocators } from '../../locators/sauce-demo/inventory.locator.js';

export class InventoryPage extends BasePage {
    constructor(page) {
        super(page);
    }

    async logout() {
        await this.click(
            InventoryLocators.burgerMenu
        );

        await this.click(
            InventoryLocators.logoutLink
        );
    }
}