
const assert = require('node:assert/strict');

const {
    createStatusCounts,
    addTestStatus,
    countTests
} = require('./test-aggregation');

// Scenario 1: Create empty counts
const empty = createStatusCounts();

assert.deepEqual(empty, {
    total: 0,
    passed: 0,
    failed: 0,
    flaky: 0,
    skipped: 0
});

// Scenario 2: Add individual statuses
const counts = createStatusCounts();

addTestStatus(counts, 'passed');
addTestStatus(counts, 'passed');
addTestStatus(counts, 'failed');
addTestStatus(counts, 'flaky');
addTestStatus(counts, 'skipped');

assert.equal(counts.total, 5);
assert.equal(counts.passed, 2);
assert.equal(counts.failed, 1);
assert.equal(counts.flaky, 1);
assert.equal(counts.skipped, 1);

// Scenario 3: Aggregate normalized tests
const tests = [
    { status: 'passed' },
    { status: 'passed' },
    { status: 'failed' },
    { status: 'flaky' },
    { status: 'skipped' }
];

const result = countTests(tests);

assert.deepEqual(result, {
    total: 5,
    passed: 2,
    failed: 1,
    flaky: 1,
    skipped: 1
});

// Scenario 4: Reject unsupported status
assert.throws(
    () => addTestStatus(createStatusCounts(), 'unexpected'),
    /unsupported test status/
);

console.log('All test aggregation tests passed.');