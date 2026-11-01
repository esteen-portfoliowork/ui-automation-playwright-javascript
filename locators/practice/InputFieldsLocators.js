// Arrange Alphabetically
// Locators for QA Playground - Input Fields Page
const InputFieldsLocators = {
    appendTab: {
        input:
            '[data-testid="input-append"]',
        result:
            '[data-testid="result-s02"]',
        section:
            '[data-testid="scenario-append-tab"]'
    },
    clearField: {
        button:
            '[data-testid="btn-clear-field"]',
        input:
            '[data-testid="input-clear"]',
        result:
            '[data-testid="result-s04"]',
        section:
            '[data-testid="scenario-clear-field"]'
    },
    disabledInput: {
        input:
            '[data-testid="input-disabled"]',
        result:
            '[data-testid="result-s05"]',
        section:
            '[data-testid="scenario-disabled-input"]'
    },
    readonlyInput: {
        input:
            '[data-testid="input-readonly"]',
        result:
            '[data-testid="result-s06"]',
        section:
            '[data-testid="scenario-readonly-input"]'
    },
    readValue: {
        button:
            '[data-testid="btn-read-value"]',
        input:
            '[data-testid="input-read-value"]',
        result:
            '[data-testid="result-s03"]',
        section:
            '[data-testid="scenario-read-value"]'
    },
    typeMovie: {
        button:
            '[data-testid="btn-submit-movie"]',
        input:
            '[data-testid="input-movie-name"]',
        result:
            '[data-testid="result-s01"]',
        section:
            '[data-testid="scenario-type-movie"]'
    }
};

module.exports = { InputFieldsLocators };