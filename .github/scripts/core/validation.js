// Validate the incoming Playwright report before processing it
// Checks whether Playwright supplied a valid report

// ---------- validatePlaywrightReport() ----------
// validatePlaywrightReport: check Playwright report
function validatePlaywrightReport(report) {
    if (!report || typeof report !== 'object') {
        throw new Error(
            'Invalid Playwright report: expected an object.'
        );
    }

    if (!Array.isArray(report.suites)) {
        throw new Error(
            'Invalid Playwright report: suites must be an array.'
        );
    }

    return true;
}
// ---------- ----------

// ---------- validateNormalizedTest() ----------
// validateNormalizedTest: check fields
function validateNormalizedTest(test) {
    if (!test || typeof test !== 'object') {
        throw new Error(
            'Invalid normalized test: expected an object.'
        );
    }

    const requiredFields = [
        'testId',
        'title',
        'application',
        'module',
        'file',
        'status'
    ];

    for (const field of requiredFields) {
        if (
            typeof test[field] !== 'string' ||
            test[field].trim() === ''
        ) {
            throw new Error(
                `Invalid normalized test: ${field} is required.`
            );
        }
    }

    const validStatuses = [
        'passed',
        'failed',
        'flaky',
        'skipped'
    ];

    if (!validStatuses.includes(test.status)) {
        throw new Error(
            `Invalid test status: ${test.status}`
        );
    }

    if (
        !Number.isFinite(test.durationMs) ||
        test.durationMs < 0
    ) {
        throw new Error(
            'Invalid normalized test: durationMs must be non-negative.'
        );
    }

    if (!Array.isArray(test.tags)) {
        throw new Error(
            'Invalid normalized test: tags must be an array.'
        );
    }

    return true;
}
// ---------- ----------

module.exports = {
    validatePlaywrightReport,
    validateNormalizedTest
};