// Arrange Alphabetically
// Validations for SauceDemo - Inventory Page
import { expect } from '@playwright/test';
import { InventoryLocators } from '../../locators/sauce-demo/inventory.locator.js';

export class InventoryValidation {
    constructor(page) {
        this.page = page;
    }

    async validateInventoryPageUrl() {
        await expect(this.page)
            .toHaveURL(/inventory/);
    }

    async validateInventoryPageDisplayed() {

        await this.validateInventoryPageUrl();

        await this.validateInventoryContainerDisplayed();

    }

    async validateInventoryContainerDisplayed() {
        await expect(
            this.page.locator(
                InventoryLocators.inventoryContainer
            )
        ).toBeVisible();
    }

}