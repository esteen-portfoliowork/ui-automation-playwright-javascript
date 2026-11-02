# Sauce Demo Inventory Test Cases

## SD-007 View Product Inventory

Module: Inventory

Priority: High

Precondition:
- User is logged in successfully

Tag: @smoke , @inventory

Steps:
1. Login to Sauce Demo using valid credentials
2. Navigate to the Inventory page
3. Observe the product listing

Expected Result:
- User is redirected to the Inventory page
- Inventory page loads successfully
- Product inventory container is displayed
- One or more products are displayed

## SD-008 Validate Product Information

Module: Inventory

Priority: High

Precondition:
- User is logged in successfully
- Inventory page is displayed

Tag: @smoke , @inventory

Steps:
1. Login to Sauce Demo using valid credentials
2. Navigate to the Inventory page
3. Select any product from the product list
4. Observe the product details displayed on the Inventory page

Expected Result:
- Product name is displayed
- Product description is displayed
- Product price is displayed
- Product image is displayed

## SD-009 Open Product Details

Module: Inventory

Priority: High

Precondition:
- User is logged in successfully
- Inventory page is displayed

Test Data:
Product: Sauce Labs Backpack

Tag: @smoke , @inventory

Steps:
1. Login to Sauce Demo using valid credentials
2. Navigate to the Inventory page
3. Click the product

Expected Result:
- Product details page is displayed
- Product name is displayed
- Product description is displayed
- Product price is displayed
- Product image is displayed

## SD-010 Validate Product Detail Information

Module: Inventory

Priority: High

Precondition:
- User is logged in successfully
- Inventory page is displayed

Test Data:
Product: Sauce Labs Backpack

Tag: @smoke , @inventory

Steps:
1. Login to Sauce Demo using valid credentials
2. Capture the product details from the Inventory page
3. Click the product
4. Compare the product information displayed

Expected Result:
- Product name on Inventory page matches Product Details page
- Product description on Inventory page matches Product Details page
- Product price on Inventory page matches Product Details page
- Product information is consistent across both pages