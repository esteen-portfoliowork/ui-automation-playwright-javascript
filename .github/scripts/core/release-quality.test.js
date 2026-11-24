const assert = require('node:assert/strict');

const {
    calculateReleaseQualityScore
} = require('./quality-scoring');

const weights = {
    passRate: 40,
    failureRate: 25,
    flakyRate: 15,
    moduleRisk: 10,
    performance: 10
};

const baseInput = {
    executedTests: 100,

    passRate: 95,
    failureRate: 2,
    flakyRate: 3,

    testStabilityIndex: {
        available: true,
        score: 90
    },

    modules: [
        { healthScore: 95 },
        { healthScore: 80 },
        { healthScore: 90 }
    ],

    averageTestDurationMs: 5000,

    weights,

    flakyRateThreshold: 5,
    slowTestThresholdMs: 10000
};

// ---------- Test 1: Score Calculation ----------

const result = calculateReleaseQualityScore(baseInput);

assert.equal(
    result.available,
    true,
    'Release Quality Score should be available.'
);

assert.equal(
    result.qualityScore,
    90.25,
    'Release Quality Score should be 90.25.'
);

// ---------- Test 2: Component Weights ----------

const totalWeight = Object.values(weights)
    .reduce((sum, value) => sum + value, 0);

assert.equal(
    totalWeight,
    100,
    'Component weights must total 100%.'
);

// ---------- Test 3: Stability Integration ----------

assert.equal(
    result.stabilityIntegration.available,
    true
);

assert.equal(
    result.componentQualityScores.flakyRate,
    65,
    'Flaky quality should blend current flaky quality and TSI.'
);

// ---------- Test 4: Module Health Integration ----------

assert.equal(
    result.moduleHealthIntegration.lowestModuleHealthScore,
    80,
    'The weakest module health score should be used.'
);

// ---------- Test 5: Missing Historical Stability ----------

const noHistoryResult = calculateReleaseQualityScore({
    ...baseInput,

    testStabilityIndex: {
        available: false,
        score: null
    }
});

assert.equal(
    noHistoryResult.available,
    true,
    'Missing historical stability should not invalidate the score.'
);

assert.equal(
    noHistoryResult.stabilityIntegration.available,
    false
);

// ---------- Test 6: Missing Required Metrics ----------

const missingPerformanceResult = calculateReleaseQualityScore({
    ...baseInput,
    averageTestDurationMs: null
});

assert.equal(
    missingPerformanceResult.available,
    false,
    'Missing required performance data must make the score unavailable.'
);

assert.equal(
    missingPerformanceResult.qualityScore,
    null
);

// ---------- Test 7: Missing Module Health ----------

const missingModuleResult = calculateReleaseQualityScore({
    ...baseInput,
    modules: []
});

assert.equal(
    missingModuleResult.available,
    false
);

// ---------- Test 8: No Executed Tests ----------

const noExecutionResult = calculateReleaseQualityScore({
    ...baseInput,
    executedTests: 0
});

assert.equal(
    noExecutionResult.available,
    false
);

// ---------- Test 9: Invalid Weights ----------

const invalidWeightsResult = calculateReleaseQualityScore({
    ...baseInput,
    weights: {
        ...weights,
        passRate: 50
    }
});

assert.equal(
    invalidWeightsResult.available,
    false
);

console.log('🏆 Release Quality Score Tests');
console.log('✅ All Release Quality Score tests passed.');
