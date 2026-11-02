// Arrange Alphabetically
// Keywords for SauceDemo - Inventory Page
import { BasePage } from '../base.page.js';
import { InventoryLocators } from '../../locators/sauce-demo/inventory.locator.js';

export class InventoryPage extends BasePage {
    constructor(page) {
        super(page);
    }

    getProduct(productName) {
        return this.page
            .locator(
                InventoryLocators.inventoryItem
            )
            .filter({
                hasText: productName
            })
            .first();
    }

    async getProductData(productName) {
        const product =
            this.getProduct(productName);

        return {
            name: await product
                .locator(
                    InventoryLocators.inventoryItemName
                )
                .textContent(),

            description: await product
                .locator(
                    InventoryLocators.inventoryItemDescription
                )
                .textContent(),

            price: await product
                .locator(
                    InventoryLocators.inventoryItemPrice
                )
                .textContent()
        };
    }

    async getProductNames() {
        return await this.page
            .locator(
                InventoryLocators.inventoryItemName
            )
            .allTextContents();
    }

    async getProductPrices() {
        const prices =
            await this.page
                .locator(
                    InventoryLocators.inventoryItemPrice
                )
                .allTextContents();

        return prices.map(
            price =>
                    Number.parseFloat(
                        price.replace('$', '').trim()
                    )
        );
    }

    async getSelectedFilter() {
        return await this.page
            .locator(
                InventoryLocators.sortDropdown
            )
            .inputValue();
    }

    async logout() {
        await this.click(
            InventoryLocators.burgerMenu
        );

        await this.click(
            InventoryLocators.logoutLink
        );
    }

    async openProduct(productName) {
        await this.page
            .locator(
                InventoryLocators.inventoryItemName
            )
            .filter({
                hasText: productName
            })
            .first()
            .click();
    }

    async selectFilter(optionValue) {
        await this.page
            .locator(
                InventoryLocators.sortDropdown
            )
            .selectOption(
                optionValue
            );
    }
}