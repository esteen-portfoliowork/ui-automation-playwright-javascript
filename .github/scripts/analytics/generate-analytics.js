// Test-result aggregation
// Generate metrics for Applications, Modules, and Tags

// Import fs
const fs = require('fs');

// Import functions from test-data.js
const {
    readPlaywrightResults
} = require('../core/test-data');

// Import functions from metrics.js
const {
    calculateMetrics
} = require('../core/metrics');

// ---------- Initialize variables ----------
const tests = readPlaywrightResults();

const analytics = {
    execution: {},
    applications: [],
    modules: [],
    tags: [],
    failedTests: [],
    flakyTests: [],
    generatedAt: new Date().toISOString()
};

const applications = {};
const modules = {};
const tags = {};
const untaggedTests = [];

const EXCLUDED_APPLICATIONS = [
    'sauce-demo',
    'orange-hrm'
];
// ---------- ----------

// ---------- getOrCreate() ----------
// getOrCreate: Either get ot create metric collections
function getOrCreate(collection, key, defaults) {
    if (!collection[key]) {
        collection[key] = {
            ...defaults,
            total: 0,
            passed: 0,
            failed: 0,
            flaky: 0,
            skipped: 0
        };
    }

    return collection[key];
}
// ---------- ----------

// ---------- incrementStatus() ----------
// incrementStatus: 
function incrementStatus(item, status) {
    item.total++;
    item[status]++;
}
// ---------- ----------

// ---------- isExcludedApplication() ----------
// isExcludedApplication: Return if tag name is an application
function isExcludedApplication(test) {
    return EXCLUDED_APPLICATIONS.includes(
        test.applicationKey
    );
}
// ---------- ----------

// ---------- Counts each logical Playwright test entry ----------
for (const test of tests) {
    const moduleKey =
        `${test.application}::${test.module}`;

    const application = getOrCreate(
        applications,
        test.application,
        {
            application: test.application
        }
    );

    const module = getOrCreate(
        modules,
        moduleKey,
        {
            application: test.application,
            module: test.module
        }
    );

    incrementStatus(application, test.status);
    incrementStatus(module, test.status);

    const testTags = test.tags;

    if (
        testTags.length === 0 &&
        !isExcludedApplication(test)
    ) {
        untaggedTests.push({
            title: test.title,
            file: test.file
        });
    }

    for (const tag of testTags) {
        const tagItem = getOrCreate(
            tags,
            tag,
            {
                tag
            }
        );

        incrementStatus(tagItem, test.status);
    }

    if (test.status === 'failed') {
        analytics.failedTests.push(test);
    }

    if (test.status === 'flaky') {
        analytics.flakyTests.push(test);
    }
}
// ---------- ----------

// ---------- addMetrics() ----------
// addMetrics: Add metrics into collection
function addMetrics(collection) {
    return Object.values(collection).map(item => ({
        ...item,
        ...calculateMetrics(
            item.total,
            item.passed,
            item.failed,
            item.flaky,
            item.skipped
        )
    }));
}
// ---------- ----------

// ---------- Analytics ----------
analytics.applications = addMetrics(applications);
analytics.modules = addMetrics(modules);
analytics.tags = addMetrics(tags);

analytics.untaggedTests = untaggedTests;

analytics.execution = {
    totalApplications: analytics.applications.length,
    totalModules: analytics.modules.length,
    totalTests: tests.length
};
// ---------- ----------

// ---------- Writes analytics.json ----------
fs.writeFileSync(
    'analytics.json',
    JSON.stringify(analytics, null, 2)
);
// ---------- ----------

console.log('analytics.json generated');