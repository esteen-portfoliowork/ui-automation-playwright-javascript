// Validate the incoming Playwright report before processing it
// Checks whether Playwright supplied a valid report

// ---------- validatePlaywrightReport() ----------
// validatePlaywrightReport: check Playwright report

function validatePlaywrightReport(report) {
    if (!report || typeof report !== 'object' || Array.isArray(report)) {
        throw new Error(
            'Invalid Playwright report: expected an object.'
        );
    }

    if (!Array.isArray(report.suites)) {
        throw new Error(
            'Invalid Playwright report: suites must be an array.'
        );
    }

    function validateSuites(suites) {
        for (const suite of suites) {
            if (!suite || typeof suite !== 'object') {
                throw new Error('Invalid suite: expected an object.');
            }

            if (suite.specs !== undefined && !Array.isArray(suite.specs)) {
                throw new Error('Invalid suite: specs must be an array.');
            }

            if (suite.suites !== undefined && !Array.isArray(suite.suites)) {
                throw new Error('Invalid suite: suites must be an array.');
            }

            for (const spec of suite.specs || []) {
                if (!spec || typeof spec !== 'object') {
                    throw new Error('Invalid spec: expected an object.');
                }

                if (spec.tests !== undefined && !Array.isArray(spec.tests)) {
                    throw new Error('Invalid spec: tests must be an array.');
                }

                for (const test of spec.tests || []) {
                    if (!test || typeof test !== 'object') {
                        throw new Error('Invalid test: expected an object.');
                    }

                    if (
                        test.results !== undefined &&
                        !Array.isArray(test.results)
                    ) {
                        throw new Error('Invalid test: results must be an array.');
                    }

                    if (
                        test.tags !== undefined &&
                        !Array.isArray(test.tags)
                    ) {
                        throw new Error('Invalid test: tags must be an array.');
                    }
                }
            }

            validateSuites(suite.suites || []);
        }
    }

    validateSuites(report.suites);

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