const assert = require('node:assert/strict');

const {
    calculateTestStabilityIndex
} = require('./quality-scoring');

console.log('\n📈 Test Stability Index Tests\n');

let passed = 0;

function test(name, callback) {
    try {
        callback();
        passed++;
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}`);
        throw error;
    }
}

// ---------- Insufficient Historical Data ----------

test('Empty history returns unavailable', () => {
    const result = calculateTestStabilityIndex([]);

    assert.equal(result.available, false);
    assert.equal(result.score, null);
    assert.equal(result.status, 'UNKNOWN');
});

test('Fewer than 3 valid runs returns unavailable', () => {
    const result = calculateTestStabilityIndex([
        { total: 10, passed: 10, failed: 0, flaky: 0 },
        { total: 10, passed: 9, failed: 0, flaky: 1 }
    ]);

    assert.equal(result.available, false);
    assert.equal(result.runsAnalyzed, 2);
});

// ---------- TSI Calculation ----------

test('Three stable runs produce 100 TSI', () => {
    const result = calculateTestStabilityIndex([
        { total: 10, passed: 10, failed: 0, flaky: 0 },
        { total: 10, passed: 10, failed: 0, flaky: 0 },
        { total: 10, passed: 10, failed: 0, flaky: 0 }
    ]);

    assert.equal(result.available, true);
    assert.equal(result.score, 100);
    assert.equal(result.status, 'STABLE');
});

test('Flaky tests reduce the TSI', () => {
    const result = calculateTestStabilityIndex([
        { total: 10, passed: 9, failed: 0, flaky: 1 },
        { total: 10, passed: 9, failed: 0, flaky: 1 },
        { total: 10, passed: 9, failed: 0, flaky: 1 }
    ]);

    assert.equal(result.available, true);
    assert.equal(result.score, 90);
    assert.equal(result.historicalFlakyRate, 10);
});

test('Failed tests are included in the executed denominator', () => {
    const result = calculateTestStabilityIndex([
        { total: 10, passed: 8, failed: 1, flaky: 1 },
        { total: 10, passed: 8, failed: 1, flaky: 1 },
        { total: 10, passed: 8, failed: 1, flaky: 1 }
    ]);

    assert.equal(result.available, true);
    assert.equal(result.score, 90);
});

test('Zero executed tests returns unavailable', () => {
    const result = calculateTestStabilityIndex([
        { total: 10, passed: 0, failed: 0, flaky: 0 },
        { total: 10, passed: 0, failed: 0, flaky: 0 },
        { total: 10, passed: 0, failed: 0, flaky: 0 }
    ]);

    assert.equal(result.available, false);
    assert.equal(result.score, null);
});

// ---------- Historical Window ----------

test('Only the latest 30 runs are analyzed', () => {
    const runs = Array.from({ length: 31 }, () => ({
        total: 10,
        passed: 10,
        failed: 0,
        flaky: 0
    }));

    const result = calculateTestStabilityIndex(runs);

    assert.equal(result.available, true);
    assert.equal(result.runsAnalyzed, 30);
});

// ---------- Result ----------

console.log('\n--------------------------------');
console.log(`Test Stability Tests: ${passed} passed`);
console.log('--------------------------------\n');