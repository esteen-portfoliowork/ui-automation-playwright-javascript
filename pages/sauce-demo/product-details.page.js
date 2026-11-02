// Arrange Alphabetically
// Keywords for SauceDemo - Product Details Page
import { BasePage } from '../base.page.js';
import { ProductDetailsLocators } from '../../locators/sauce-demo/product-details.locator.js';

export class ProductDetailsPage extends BasePage {
    constructor(page) {
        super(page);
    }

    async getProductDescription() {
        return await this.getText(
            ProductDetailsLocators.productDescription
        );
    }

    async getProductName() {
        return await this.getText(
            ProductDetailsLocators.productName
        );
    }

    async getProductPrice() {
        return await this.getText(
            ProductDetailsLocators.productPrice
        );
    }
}