// Aggregates normalized status counts.

// Import functions from constants.js
const {
    TEST_STATUSES
} = require('./constants');

// ---------- createStatusCounts() ----------
// createStatusCounts: Creates a consistent status-count object.
function createStatusCounts(metadata = {}) {
    return {
        ...metadata,
        total: 0,
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0
    };
}
// ---------- ----------

// ---------- addTestStatus() ----------
// addTestStatus: Adds one normalized test to an existing count object.
function addTestStatus(counts, status) {
    if (!TEST_STATUSES.includes(status)) {
        throw new Error(
            `Cannot aggregate unsupported test status: ${status}`
        );
    }

    counts.total++;
    counts[status]++;

    return counts;
}
// ---------- ----------

// ---------- countTests() ----------
// countTests: Aggregates the status counts for a list of normalized tests.
function countTests(tests) {
    const counts = createStatusCounts();

    for (const test of tests) {
        addTestStatus(counts, test.status);
    }

    return counts;
}
// ---------- ----------

module.exports = {
    createStatusCounts,
    addTestStatus,
    countTests
};