# Sauce Demo Authentication Test Cases

## SD-001 Login with Valid Credentials

Module: Authentication

Priority: High

Precondition:
- User is on Login page

Test Data:
Username: standard_user
Password: secret_sauce

Tag: @smoke , @authentication

Steps:
1. Navigate to Sauce Demo login page
2. Enter username
3. Enter password
4. Click Login

Expected Result:
- User is redirected to Inventory page
- Inventory page is displayed successfully

## SD-002 Login with Invalid Credentials

Module: Authentication

Priority: High

Precondition:
- User is on Login page

Test Data:
Username: invalid_user
Password: invalid_password

Tag: @regression , @authentication

Steps:
1. Navigate to Sauce Demo login page
2. Enter username
3. Enter password
4. Click Login

Expected Result:
- User remains on Login page
- Error message is displayed

## SD-003 Login with Empty Credential

Module: Authentication

Priority: High

Precondition:
- User is on Login page

Tag: @regression , @authentication

Steps:
1. Navigate to Sauce Demo login page
2. Leave username blank
3. Leave password blank
4. Click Login

Expected Result:
- User remains on Login page
- Error message is displayed

## SD-004 Login with Empty Password

Module: Authentication

Priority: High

Precondition:
- User is on Login page

Test Data:
Username: standard_user

Tag: @regression , @authentication

Steps:
1. Navigate to Sauce Demo login page
2. Enter username
3. Leave password blank
4. Click Login

Expected Result:
- User remains on Login page
- Error message is displayed

## SD-005 Login with Locked Out Credentials

Module: Authentication

Priority: High

Precondition:
- User is on Login page

Test Data:
Username: locked_out_user
Password: secret_sauce

Tag: @regression , @authentication

Steps:
1. Navigate to Sauce Demo login page
2. Enter username
3. Enter password
4. Click Login

Expected Result:
- User remains on Login page
- Error message is displayed

## SD-006 Logout Successfully

Module: Authentication

Priority: High

Precondition:
- User is logged in

Tag: @regression , @authentication

Steps:
1. Click Menu
2. Click Logout

Expected Result:
- User is redirected to Login page
- Session is terminated