// Arrange Alphabetically
// Test Data for SauceDemo - Authentication
export const users = {
    empty: {
        username: '',
        password: ''
    },
    invalid: {
        username: 'invalid_user',
        password: 'invalid_password'
    },
    lockedOut: {
        username: 'locked_out_user',
        password: 'secret_sauce'
    },
    standard: {
        username: 'standard_user',
        password: 'secret_sauce'
    }
};

export const authMessages = {
    emptyCredentials:
        'Epic sadface: Username is required',
    emptyPassword:
        'Epic sadface: Password is required',
    lockedOutUser:
        'Epic sadface: Sorry, this user has been locked out.',
    invalidCredentials:
        'Epic sadface: Username and password do not match any user in this service'
};