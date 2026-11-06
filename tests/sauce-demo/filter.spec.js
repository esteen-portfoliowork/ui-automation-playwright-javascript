import { test } from '@playwright/test';
import { LoginPage } from '../../pages/sauce-demo/login.page.js';
import { InventoryPage } from '../../pages/sauce-demo/inventory.page.js';
import { InventoryValidation } from '../../validations/sauce-demo/inventory.validation.js';
import { filterOptions } from '../../data/sauce-demo/filter.data.js';

test.describe('SauceDemo - Filter', () => {
    let loginPage;
    let inventoryPage;

    let inventoryValidation;

    test.beforeAll(async () => {

        console.log(
            '======================================='
        );

        console.log(
            'Starting Sauce Demo Filter Module Tests'
        );

        console.log(
            '======================================='
        );

    });

    test.beforeEach(async ({ page }) => {

        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);

        inventoryValidation = new InventoryValidation(page);

        await loginPage.navigateToLogin();

    });

    const filterTests = [
        {
            id: 'SD-011',
            title: 'Filter Products by Name (A to Z)',
            tag: ['@regression', '@e2e', '@filter', '@positive', '@sauce-demo'],
            filter: filterOptions.nameAscending,
            getter: 'getProductNames',
            validator: 'validateAscendingOrder'
        },
        {
            id: 'SD-012',
            title: 'Filter Products by Name (Z to A)',
            tag: ['@regression', '@e2e', '@filter', '@positive', '@sauce-demo'],
            filter: filterOptions.nameDescending,
            getter: 'getProductNames',
            validator: 'validateDescendingOrder'
        },
        {
            id: 'SD-013',
            title: 'Filter Products by Price (Low to High)',
            tag: ['@regression', '@e2e', '@filter', '@positive', '@sauce-demo'],
            filter: filterOptions.priceAscending,
            getter: 'getProductPrices',
            validator: 'validateAscendingOrder'
        },
        {
            id: 'SD-014',
            title: 'Filter Products by Price (High to Low)',
            tag: ['@regression', '@e2e', '@filter', '@positive', '@sauce-demo'],
            filter: filterOptions.priceDescending,
            getter: 'getProductPrices',
            validator: 'validateDescendingOrder'
        },
        {
            id: 'SD-015-FAIL',
            title: 'Filter Products by Name (A to Z)',
            tag: ['@regression', '@e2e', '@filter', '@positive', '@sauce-demo'],
            filter: filterOptions.nameAscending,
            getter: 'getProductNames',
            validator: 'validateDescendingOrder'
        },
    ];

    filterTests.forEach(testData => {
        test(`${testData.id} ${testData.title}`,
        {
            tag: testData.tag
        },
        async () => {
            await loginPage.loginAsStandardUser();

            await inventoryPage.selectFilter(
                testData.filter
            );

            const selectedFilter =
                await inventoryPage.getSelectedFilter();

            await inventoryValidation.validateFilterApplied(
                selectedFilter,
                testData.filter
            );

            const items =
                await inventoryPage[testData.getter]();

            await inventoryValidation[testData.validator](
                items
            );
        });
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
            'Filter Suite Completed'
        );

        console.log(
            '======================================='
        );

    });
});