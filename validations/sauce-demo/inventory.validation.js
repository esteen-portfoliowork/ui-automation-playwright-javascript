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

    // async validateAscendingNames(names) {
    //     const sorted = [...names]
    //         .sort();

    //     expect(names)
    //         .toEqual(sorted);
    // }

    // async validateAscendingPrices(prices) {
    //     const sorted = [...prices]
    //         .sort(
    //             (a, b) => a - b
    //         );

    //     expect(prices)
    //         .toEqual(sorted);
    // }

    // async validateDescendingNames(names) {
    //     const sorted = [...names]
    //         .sort()
    //         .reverse();

    //     expect(names)
    //         .toEqual(sorted);
    // }

    // async validateDescendingPrices(prices) {
    //     const sorted = [...prices]
    //         .sort(
    //             (a, b) => b - a
    //         );

    //     expect(prices)
    //         .toEqual(sorted);
    // }

    async validateAscendingOrder(items) {
        const sorted = [...items].sort(
            (a, b) =>
                typeof a === 'number'
                    ? a - b
                    : a.localeCompare(b)
        );

        expect(items).toEqual(sorted);
    }

    async validateDescendingOrder(items) {
        const sorted = [...items].sort(
            (a, b) =>
                typeof a === 'number'
                    ? b - a
                    : b.localeCompare(a)
        );

        expect(items).toEqual(sorted);
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
        ).not.toHaveCount(0);
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

    async validateFilterApplied(actual, expected) {
        expect(
            actual
        ).toBe(
            expected
        );
    }

}