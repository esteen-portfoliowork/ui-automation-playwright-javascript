// Arrange Alphabetically
// Validations for SauceDemo - Inventory Page
import { expect } from '@playwright/test';
import { InventoryPage } from '../../pages/sauce-demo/inventory.page.js';
import { InventoryLocators } from '../../locators/sauce-demo/inventory.locator.js';

export class InventoryValidation {
    constructor(page) {
        this.page = page;
        this.inventoryPage = new InventoryPage(page);
    }

    async validateInventoryDisplayed() {
        await this.validateInventoryPageUrl();

        await expect(
            this.page.locator(
                InventoryLocators.inventoryContainer
            )
        ).toBeVisible();
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

    async validateProductsExist() {
        await expect(
            this.page.locator(
                InventoryLocators.inventoryItem
            )
        ).toHaveCount(6);
    }

    async validateProductInformationDisplayed(productName) {
        const product =
            this.inventoryPage
                .getProduct(productName);
        
        await expect(
            product.locator(
                InventoryLocators.inventoryItemName
            )
        ).toBeVisible();

        await expect(
            product.locator(
                InventoryLocators.inventoryItemDescription
            )
        ).toBeVisible();

        await expect(
            product.locator(
                InventoryLocators.inventoryItemPrice
            )
        ).toBeVisible();

        await expect(
            product.locator(
                InventoryLocators.inventoryItemImage
            )
        ).toBeVisible();
    }

}