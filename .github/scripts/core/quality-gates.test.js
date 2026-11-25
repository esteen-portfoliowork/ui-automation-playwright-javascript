const assert = require('node:assert/strict');

const {
    evaluateQualityGates
} = require('./quality-gates');

const fs = require('node:fs');
const path = require('node:path');

const config = JSON.parse(
    fs.readFileSync(
        path.resolve(
            __dirname,
            '../../../.github/config/quality-gates.json'
        ),
        'utf8'
    )
);

console.log('\n🚦 Quality Gate Tests\n');

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

// ---------- Fixtures ----------

function createFixture() {
    return {
        riskAnalysis: {
            releaseReadiness: {
                available: true,
                qualityScore: 88,
                score: 88,

                metrics: {
                    totalTests: 100,
                    executedTests: 100,
                    passedTests: 98,
                    failedTests: 1,
                    flakyTests: 1,
                    skippedTests: 0,

                    passRate: 98,
                    failureRate: 1,
                    flakyRate: 1
                }
            },

            testStabilityIndex: {
                available: true,
                score: 90,
                status: 'STABLE'
            },

            modules: [
                {
                    application: 'SauceDemo',
                    module: 'login',
                    healthScore: 90,
                    healthStatus: '🟢 Healthy'
                },
                {
                    application: 'SauceDemo',
                    module: 'checkout',
                    healthScore: 80,
                    healthStatus: '🔵 Good'
                }
            ]
        },

        reportingFiles: {
            'analytics.json': true,
            'risk-analysis.json': true,
            'release-readiness.json': true
        }
    };
}

function evaluate(fixture, overrides = {}) {
    return evaluateQualityGates({
        ...fixture,
        config: {
            ...config,
            ...overrides
        }
    });
}

// ---------- Overall Evaluation ----------

test('All valid metrics produce PASSED Quality Gate', () => {
    const result = evaluate(createFixture());

    assert.equal(result.status, 'PASSED');
    assert.equal(result.passed, true);
    assert.equal(result.summary.failed, 0);
    assert.equal(result.summary.unavailable, 0);
});

test('Quality Gate produces explicit results for each criterion', () => {
    const result = evaluate(createFixture());

    for (const gate of result.results) {
        assert.ok(gate.id);
        assert.ok(gate.name);
        assert.ok(gate.status);

        assert.ok([
            'PASSED',
            'FAILED',
            'UNAVAILABLE',
            'SKIPPED'
        ].includes(gate.status));

        assert.equal(
            typeof gate.passed,
            'boolean'
        );

        assert.ok(gate.explanation);
    }
});

// ---------- Minimum Test Count ----------

test('Minimum test count exact boundary passes', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.metrics.executedTests = 1;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumTestCount'
    );

    assert.equal(gate.status, 'PASSED');
});

test('Minimum test count below boundary fails', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.metrics.executedTests = 0;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumTestCount'
    );

    assert.equal(gate.status, 'FAILED');
    assert.equal(result.status, 'FAILED');
});

// ---------- Pass Rate ----------

test('Minimum pass rate exact boundary passes', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.metrics.passRate = 95;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumPassRate'
    );

    assert.equal(gate.status, 'PASSED');
});

test('Pass rate below minimum fails', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.metrics.passRate = 94.99;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumPassRate'
    );

    assert.equal(gate.status, 'FAILED');
});

// ---------- Failure Rate ----------

test('Maximum failure rate exact boundary passes', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.metrics.failureRate = 5;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'maximumFailureRate'
    );

    assert.equal(gate.status, 'PASSED');
});

test('Failure rate above maximum fails', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.metrics.failureRate = 5.01;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'maximumFailureRate'
    );

    assert.equal(gate.status, 'FAILED');
});

// ---------- Flaky Rate ----------

test('Maximum flaky rate exact boundary passes', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.metrics.flakyRate = 10;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'maximumFlakyRate'
    );

    assert.equal(gate.status, 'PASSED');
});

test('Flaky rate above maximum fails', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.metrics.flakyRate = 10.01;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'maximumFlakyRate'
    );

    assert.equal(gate.status, 'FAILED');
});

// ---------- Test Stability Index ----------

test('Minimum TSI exact boundary passes', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.testStabilityIndex.score = 75;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumTestStabilityIndex'
    );

    assert.equal(gate.status, 'PASSED');
});

test('TSI below minimum fails', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.testStabilityIndex.score = 74.99;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumTestStabilityIndex'
    );

    assert.equal(gate.status, 'FAILED');
});

test('Unavailable TSI cannot pass', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.testStabilityIndex = {
        available: false,
        score: null
    };

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumTestStabilityIndex'
    );

    assert.equal(gate.status, 'UNAVAILABLE');
    assert.equal(result.status, 'FAILED');
});

// ---------- Module Health ----------

test('Minimum Module Health exact boundary passes', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.modules = [
        {
            application: 'SauceDemo',
            module: 'checkout',
            healthScore: 50,
            healthStatus: '🟡 Needs Attention'
        }
    ];

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumModuleHealthScore'
    );

    assert.equal(gate.status, 'PASSED');
});

test('Module Health below minimum fails', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.modules = [
        {
            application: 'SauceDemo',
            module: 'checkout',
            healthScore: 49.99,
            healthStatus: '🔴 Critical'
        }
    ];

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumModuleHealthScore'
    );

    assert.equal(gate.status, 'FAILED');
});

test('No valid Module Health Score is unavailable', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.modules = [
        {
            application: 'SauceDemo',
            module: 'checkout',
            healthScore: null,
            healthStatus: '⚪ Unknown'
        }
    ];

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumModuleHealthScore'
    );

    assert.equal(gate.status, 'UNAVAILABLE');
});

// ---------- Release Quality Score ----------

test('Minimum Release Quality exact boundary passes', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.qualityScore = 75;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumReleaseQualityScore'
    );

    assert.equal(gate.status, 'PASSED');
});

test('Release Quality below minimum fails', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.qualityScore = 74.99;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumReleaseQualityScore'
    );

    assert.equal(gate.status, 'FAILED');
});

test('Unavailable Release Quality Score cannot pass', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.available = false;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumReleaseQualityScore'
    );

    assert.equal(gate.status, 'UNAVAILABLE');
});

// ---------- Critical Module Restriction ----------

test('No Critical modules passes restriction', () => {
    const result = evaluate(createFixture());

    const gate = result.results.find(
        item => item.id === 'criticalModuleRestriction'
    );

    assert.equal(gate.status, 'PASSED');
});

test('Critical module fails restriction', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.modules.push({
        application: 'SauceDemo',
        module: 'checkout-critical',
        healthScore: 49,
        healthStatus: '🔴 Critical'
    });

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'criticalModuleRestriction'
    );

    assert.equal(gate.status, 'FAILED');
});

// ---------- Reporting Data ----------

test('All required reporting files pass', () => {
    const result = evaluate(createFixture());

    const gate = result.results.find(
        item => item.id === 'requiredReportingData'
    );

    assert.equal(gate.status, 'PASSED');
});

test('Missing reporting file fails', () => {
    const fixture = createFixture();

    fixture.reportingFiles['analytics.json'] = false;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'requiredReportingData'
    );

    assert.equal(gate.status, 'FAILED');
});

// ---------- Missing Metrics ----------

test('Missing execution metrics cannot silently pass', () => {
    const fixture = createFixture();

    delete fixture.riskAnalysis.releaseReadiness
        .metrics.passRate;

    const result = evaluate(fixture);

    const gate = result.results.find(
        item => item.id === 'minimumPassRate'
    );

    assert.equal(gate.status, 'UNAVAILABLE');
    assert.equal(result.status, 'FAILED');
});

test('Zero executed tests cannot pass', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.metrics.executedTests = 0;

    const result = evaluate(fixture);

    assert.equal(result.status, 'FAILED');
});

// ---------- Disabled Criteria ----------

test('Disabled criterion is SKIPPED', () => {
    const result = evaluate(createFixture(), {
        thresholds: {
            ...config.thresholds,

            maximumFlakyRate: {
                enabled: false,
                value: 10
            }
        }
    });

    const gate = result.results.find(
        item => item.id === 'maximumFlakyRate'
    );

    assert.equal(gate.status, 'SKIPPED');
});

// ---------- Determinism ----------

test('Same inputs produce identical gate results', () => {
    const fixture = createFixture();

    const first = evaluate(fixture);
    const second = evaluate(fixture);

    assert.deepEqual(
        first.results,
        second.results
    );

    assert.equal(first.status, second.status);
});

console.log('\n--------------------------------');
console.log(`Quality Gate Tests: ${passed} passed`);
console.log('--------------------------------\n');