import { test } from '@playwright/test';
import { LoginPage } from '../../pages/sauce-demo/login.page.js';
import { InventoryPage } from '../../pages/sauce-demo/inventory.page.js';
import { ProductDetailsPage } from '../../pages/sauce-demo/product-details.page.js';
import { InventoryValidation } from '../../validations/sauce-demo/inventory.validation.js';
import { ProductDetailsValidation } from '../../validations/sauce-demo/product-details.validation.js';
import { products } from '../../data/sauce-demo/inventory.data.js';

test.describe('SauceDemo - Inventory', () => {
    let loginPage;
    let inventoryPage;
    let productDetailsPage;

    let inventoryValidation;
    let productDetailsValidation;

    const productName =
        products.backpack.name;

    test.beforeAll(async () => {

        console.log(
            '======================================='
        );

        console.log(
            'Starting Sauce Demo Inventory Module Tests'
        );

        console.log(
            '======================================='
        );

    });

    test.beforeEach(async ({ page }) => {

        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);
        productDetailsPage = new ProductDetailsPage(page);

        inventoryValidation = new InventoryValidation(page);
        productDetailsValidation = new ProductDetailsValidation(page);

        await loginPage.navigateToLogin();

    });

    test('SD-007 SD-008 View Inventory and Validate Product Information', 
    async () => {

        await loginPage.loginAsStandardUser();

        await inventoryValidation.validateInventoryPageDisplayed();

        await inventoryValidation.validateProductsExist();

        await inventoryValidation.validateProductInformationDisplayed(
            productName
        );
    });

    test('SD-009 Open Product Details',
    async () => {

        await loginPage.loginAsStandardUser();

        await inventoryPage.openProduct(
            productName
        );

        await productDetailsValidation.validateProductDetailsDisplayed();
    });

    test('SD-010 Validate Product Detail Information',
    async () => {

        await loginPage.loginAsStandardUser();

        const expectedProduct =
            await inventoryPage.getProductData(
                productName
            );

        await inventoryPage.openProduct(
            productName
        );

        await productDetailsValidation.validateProductInformation(
            expectedProduct
        );
    });

    test.afterEach(async ({ page }, testInfo) => {

        console.log(
            `Finished: ${testInfo.title}`
        );

        console.log(
            `Status: ${testInfo.status}`
        );

        if (
            testInfo.status !==
            testInfo.expectedStatus
        ) {

            await page.screenshot({
                path:
                    `test-results/screenshots/${testInfo.title}.png`,
                fullPage: true
            });

        }
    });

    test.afterAll(async () => {

        console.log(
            '======================================='
        );

        console.log(
            'Inventory Suite Completed'
        );

        console.log(
            '======================================='
        );

    });
});