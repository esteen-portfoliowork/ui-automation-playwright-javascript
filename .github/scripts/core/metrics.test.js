const assert = require('node:assert/strict');

const {
    getHealth,
    calculateMetrics
} = require('./metrics');

// Scenario 1: All passed
const healthy = calculateMetrics(
    100, 100, 0, 0, 0
);

assert.equal(healthy.passRate, 100);
assert.equal(healthy.qualityScore, 100);
assert.equal(healthy.health, '🟢 Healthy');

// Scenario 2: Failed tests
const failed = calculateMetrics(
    100, 80, 20, 0, 0
);

assert.equal(failed.passRate, 80);
assert.equal(failed.failRate, 20);
assert.equal(failed.health, '🔴 Critical');

// Scenario 3: Flaky tests
const flaky = calculateMetrics(
    100, 80, 10, 10, 0
);

assert.equal(flaky.passRate, 90);
assert.equal(flaky.qualityScore, 85);
assert.equal(flaky.health, '🔴 Critical');

// Scenario 4: Flaky but no failures
const unstable = calculateMetrics(
    100, 80, 0, 20, 0
);

assert.equal(unstable.passRate, 100);
assert.equal(unstable.qualityScore, 90);
assert.equal(unstable.health, '🟡 Unstable');

// Scenario 5: Skipped tests only
const noExecutedTests = calculateMetrics(
    100, 0, 0, 0, 100
);

assert.equal(noExecutedTests.passRate, 0);
assert.equal(noExecutedTests.qualityScore, 0);
assert.equal(noExecutedTests.health, '⚪ Unknown');


// Scenario 5A: Some tests passed, but most were skipped
const partiallyExecuted = calculateMetrics(
    100, 10, 0, 0, 90
);

assert.equal(partiallyExecuted.passRate, 10);
assert.equal(partiallyExecuted.qualityScore, 10);
assert.equal(partiallyExecuted.health, '🟢 Healthy');

// Scenario 5B: Only skipped tests
const skippedOnly = calculateMetrics(
    100, 0, 0, 0, 100
);

assert.equal(skippedOnly.passRate, 0);
assert.equal(skippedOnly.qualityScore, 0);
assert.equal(skippedOnly.health, '⚪ Unknown');

// Scenario 6: Empty execution
const empty = calculateMetrics(
    0, 0, 0, 0, 0
);

assert.equal(empty.passRate, 0);
assert.equal(empty.health, '⚪ Unknown');

// Scenario 7: Invalid counts
assert.throws(
    () => calculateMetrics(100, 80, 10, 5, 0),
    /Inconsistent test counts/
);

console.log('All core metric tests passed.');
