// Read and normalize test results

const fs = require('fs');
const path = require('path');

const {
    validatePlaywrightReport,
    validateNormalizedTest
} = require('./validation');

// Maps application folder names to display names
const APPLICATIONS = {
    'expand-testing': 'Expand Testing',
    'orange-hrm': 'Orange HRM',
    'qa-playground': 'QA Playground',
    'sauce-demo': 'SauceDemo'
};

// Define Status
const VALID_STATUSES = [
    'passed',
    'failed',
    'flaky',
    'skipped'
];

// ---------- getTestStatus() ----------
// getTestStatus: Convert Playwright status into our shared status.
function getTestStatus(test) {
    const statusMap = {
        expected: 'passed',
        unexpected: 'failed',
        flaky: 'flaky',
        skipped: 'skipped'
    };

    if (statusMap[test.status]) {
        return statusMap[test.status];
    }

    // Fallback when the final test status is unavailable.
    const results = test.results || [];
    const lastResult = results.at(-1);

    if (!lastResult) {
        if (test.expectedStatus === 'skipped') {
            return 'skipped';
        }

        throw new Error(
            'Unable to classify test: no final status or result.'
        );
    }

    if (lastResult.status === 'skipped') {
        return 'skipped';
    }

    if (
        lastResult.status === 'failed' ||
        lastResult.status === 'timedOut' ||
        lastResult.status === 'interrupted'
    ) {
        return 'failed';
    }

    if (lastResult.status === 'passed') {
        const hadPreviousFailure = results
            .slice(0, -1)
            .some(result =>
                result.status === 'failed' ||
                result.status === 'timedOut' ||
                result.status === 'interrupted'
            );

        return hadPreviousFailure ? 'flaky' : 'passed';
    }

    throw new Error(
        `Unsupported Playwright result status: ${lastResult.status}`
    );
}
// ---------- ----------

// ---------- getTestMetadata() ----------
// getTestMetadata: Resolve application and module from the test file path.
function getTestMetadata(file) {
    const normalizedFile = file.replace(/\\/g, '/');
    const parts = normalizedFile.split('/');

    const applicationIndex = parts.findIndex(
        part => Object.hasOwn(APPLICATIONS, part)
    );

    const applicationKey = applicationIndex >= 0
        ? parts[applicationIndex]
        : parts[0] || 'unknown';

    const application = APPLICATIONS[applicationKey] ||
        applicationKey;

    const moduleFile = applicationIndex >= 0
        ? parts[applicationIndex + 1]
        : parts[1] || parts[0] || 'unknown';

    const module = path.basename(moduleFile)
        .replace(/\.spec\.(js|ts)$/, '')
        .replace(/\.(js|ts)$/, '');

    return {
        application,
        applicationKey,
        module
    };
}
// ---------- ----------

// ---------- normalizeTags() ----------
// normalizeTags: Normalize tags into a consistent format.
function normalizeTags(specTags = [], testTags = []) {
    return [
        ...new Set(
            [...specTags, ...testTags]
                .map(tag =>
                    String(tag)
                        .replace(/^@/, '')
                        .trim()
                        .toLowerCase()
                )
                .filter(Boolean)
        )
    ];
}
// ---------- ----------

// ---------- getTestError() ----------
// getTestError: Extract the final error message.
function getTestError(results = []) {
    const lastResult = results.at(-1) || {};

    return (
        lastResult.error?.message ||
        lastResult.errors?.[0]?.message ||
        null
    );
}
// ---------- ----------

// ---------- normalizeTest() ----------
// normalizeTest: Normalize one logical test record.
function normalizeTest(test, spec, file) {
    const testFile = test.location?.file || spec.file || file || 'Unknown';

    const metadata = getTestMetadata(testFile);

    const results = test.results || [];

    const status = getTestStatus(test);

    const durationMs = results.reduce(
        (total, result) =>
            total + (Number(result.duration) || 0),
        0
    );

    const retries = Math.max(0, results.length - 1);

    const line = test.location?.line || spec.line || 0;
    const column = test.location?.column || spec.column || 0;

    const project = test.projectName || 'Default';

    const title = test.title || spec.title || 'Untitled test';

    const testId = [
        testFile,
        line,
        column,
        project,
        title
    ].join(':');

    const normalizedTest = {
        testId,
        title,
        application: metadata.application,
        applicationKey: metadata.applicationKey,
        module: metadata.module,
        file: testFile,
        project,
        status,
        durationMs,
        retries,
        tags: normalizeTags(spec.tags, test.tags),
        error: status === 'failed' || status === 'flaky'
            ? getTestError(results)
            : null
    };

    validateNormalizedTest(normalizedTest);

    return normalizedTest;
}
// ---------- ----------

// ---------- normalizePlaywrightResults() ----------
// normalizePlaywrightResults: Recursively process Playwright suites.
function normalizePlaywrightResults(report) {
    validatePlaywrightReport(report);

    const normalizedTests = [];

    function walkSuites(suites, parentFile = '') {
        for (const suite of suites) {
            const file = suite.file || parentFile;

            for (const spec of suite.specs || []) {
                const specFile = spec.file || file || 'Unknown';

                for (const test of spec.tests || []) {
                    normalizedTests.push(
                        normalizeTest(test, spec, specFile)
                    );
                }
            }

            walkSuites(
                suite.suites || [],
                file
            );
        }
    }

    walkSuites(report.suites);

    return normalizedTests;
}
// ---------- ----------

// ---------- readPlaywrightResults() ----------
// readPlaywrightResults: Read and normalize the Playwright JSON report.
function readPlaywrightResults(
    reportPath = 'playwright-report/results.json'
) {
    if (!fs.existsSync(reportPath)) {
        throw new Error(
            `Playwright results file not found: ${reportPath}`
        );
    }

    let report;

    try {
        report = JSON.parse(
            fs.readFileSync(reportPath, 'utf8')
        );
    } catch (error) {
        throw new Error(
            `Unable to parse Playwright results: ${error.message}`
        );
    }

    return normalizePlaywrightResults(report);
}
// ---------- ----------

module.exports = {
    APPLICATIONS,
    getTestStatus,
    getTestMetadata,
    normalizeTags,
    normalizePlaywrightResults,
    readPlaywrightResults
};