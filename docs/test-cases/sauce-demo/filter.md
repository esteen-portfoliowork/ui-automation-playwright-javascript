# Sauce Demo Filter Test Cases

## SD-011 Filter Products by Name (A to Z)

Module: Filter

Priority: High

Precondition:
- User is logged in successfully
- Inventory page is displayed

Tag: @smoke , @filter

Steps:
1. Login to Sauce Demo using valid credentials
2. Select "Name (A to Z)" from the product sort dropdown
3. Observe the product ordering

Expected Result:
- Products are sorted alphabetically in ascending order
- First product displayed is "Sauce Labs Backpack"
- Last product displayed is "Test.allTheThings() T-Shirt (Red)"

## SD-012 Filter Products by Name (Z to A)

Module: Filter

Priority: High

Precondition:
- User is logged in successfully
- Inventory page is displayed

Tag: @regression , @filter

Steps:
1. Login to Sauce Demo using valid credentials
2. Select "Name (Z to A)" from the product sort dropdown
3. Observe the product ordering

Expected Result:
- Products are sorted alphabetically in descending order
- First product displayed is "Test.allTheThings() T-Shirt (Red)"
- Last product displayed is "Sauce Labs Backpack"

## SD-013 Filter Products by Price (Low to High)

Module: Filter

Priority: High

Precondition:
- User is logged in successfully
- Inventory page is displayed

Tag: @regression , @filter

Steps:
1. Login to Sauce Demo using valid credentials
2. Select "Price (Low to High)" from the product sort dropdown
3. Observe the product ordering

Expected Result:
- Products are sorted by price in ascending order
- Lowest priced product appears first
- Highest priced product appears last

## SD-014 Filter Products by Price (Hight to Low)

Module: Filter

Priority: High

Precondition:
- User is logged in successfully
- Inventory page is displayed

Tag: @regression , @filter

Steps:
1. Login to Sauce Demo using valid credentials
2. Select "Price (Hight to Low)" from the product sort dropdown
3. Observe the product ordering

Expected Result:
- Products are sorted by price in ascending order
- Highest priced product appears first
- Lowest priced product appears last