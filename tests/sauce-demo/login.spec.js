import { test } from '@playwright/test';
import { LoginPage } from '../../pages/sauce-demo/login.page.js';
import { InventoryPage } from '../../pages/sauce-demo/inventory.page.js';
import { LoginValidation } from '../../validations/sauce-demo/login.validation.js';
import { InventoryValidation } from '../../validations/sauce-demo/inventory.validation.js';
import { users, authMessages } from '../../data/sauce-demo/auth.data.js';

test.describe('SauceDemo - Authentication', () => {
    let loginPage;
    let inventoryPage;

    let loginValidation;
    let inventoryValidation;

    test.beforeAll(async () => {

        console.log(
            '======================================='
        );

        console.log(
            'Starting Sauce Demo Authentication Module Tests'
        );

        console.log(
            '======================================='
        );

    });

    test.beforeEach(async ({ page }) => {

        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);

        loginValidation = new LoginValidation(page);
        inventoryValidation = new InventoryValidation(page);

        await loginPage.navigateToLogin();

    });

    test('SD-001 Login with Valid Credentials', 
    async () => {
        
        await loginPage.login(
            users.standard.username,
            users.standard.password
        );

        await inventoryValidation.validateInventoryPageDisplayed();

    });

    test('SD-002 Login with Invalid Credentials', 
    async () => {
        
        await loginPage.login(
            users.invalid.username,
            users.invalid.password
        );

        await loginValidation.validateUserRemainsOnLoginPage();

        await loginValidation.validateErrorMessage(
            authMessages.invalidCredentials
        );
    });

    test('SD-003 Login with Empty Credentials', 
    async () => {
        
        await loginPage.login();

        await loginValidation.validateUserRemainsOnLoginPage();

        await loginValidation.validateErrorMessage(
            authMessages.emptyCredentials
        );
    });

    test('SD-004 Login with Empty Password', 
    async () => {
        
        await loginPage.login(
            users.standard.username
        );

        await loginValidation.validateUserRemainsOnLoginPage();

        await loginValidation.validateErrorMessage(
            authMessages.emptyPassword
        );
    });

    test('SD-005 Login with Locked Out Credentials', 
    async () => {
        
        await loginPage.login(
            users.lockedOut.username,
            users.lockedOut.password
        );

        await loginValidation.validateUserRemainsOnLoginPage();

        await loginValidation.validateErrorMessage(
            authMessages.lockedOutUser
        );
    });

    test('SD-006 Logout Successfully', 
    async () => {
        
        await loginPage.loginAsStandardUser();

        await inventoryPage.logout();

        await loginValidation.validateUserLoggedOut();
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
            'Authentication Suite Completed'
        );

        console.log(
            '======================================='
        );

    });
});