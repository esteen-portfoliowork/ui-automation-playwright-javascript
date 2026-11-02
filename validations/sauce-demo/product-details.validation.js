// Arrange Alphabetically
// Validations for SauceDemo - Inventory Page
import { expect } from '@playwright/test';
import { ProductDetailsLocators } from '../../locators/sauce-demo/product-details.locator.js';

export class ProductDetailsValidation {
    constructor(page) {
        this.page = page;
    }

    async validateProductInformation(expectedProduct) {
        await expect(this.page)
            .toHaveURL(/inventory-item/);

        await expect(
            this.page.locator(
                ProductDetailsLocators.productName
            )
        ).toHaveText(
            expectedProduct.name
        );

        await expect(
            this.page.locator(
                ProductDetailsLocators.productDescription
            )
        ).toHaveText(
            expectedProduct.description
        );

        await expect(
            this.page.locator(
                ProductDetailsLocators.productPrice
            )
        ).toHaveText(
            expectedProduct.price
        );
    }

    async validateProductDetailsDisplayed() {
        await expect(this.page)
            .toHaveURL(/inventory-item/);

        await expect(
            this.page.locator(
                ProductDetailsLocators.productName
            )
        ).toBeVisible();

        await expect(
            this.page.locator(
                ProductDetailsLocators.productDescription
            )
        ).toBeVisible();

        await expect(
            this.page.locator(
                ProductDetailsLocators.productPrice
            )
        ).toBeVisible();

        await expect(
            this.page.locator(
                ProductDetailsLocators.productImage
            )
        ).toBeVisible();
    }
}