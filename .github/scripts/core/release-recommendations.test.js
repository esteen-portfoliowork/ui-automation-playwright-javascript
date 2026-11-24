
const assert = require('node:assert/strict');

const {
    generateReleaseRecommendation
} = require('./release-recommendations');

// ---------- Shared Test Data ----------

const baseInput = {
    releaseQuality: {
        available: true,
        qualityScore: 95
    },

    testStability: {
        available: true,
        score: 95
    },

    modules: [
        {
            application: 'SauceDemo',
            module: 'login',
            healthScore: 95,
            riskLevel: 'Low'
        },
        {
            application: 'SauceDemo',
            module: 'inventory',
            healthScore: 92,
            riskLevel: 'Low'
        }
    ],

    execution: {
        executedTests: 100,
        failedTests: 0,
        failureRate: 0
    },

    qualityGate: {
        configured: false,
        status: 'NOT_CONFIGURED'
    }
};

// ---------- Test 1: GO ----------

const goResult = generateReleaseRecommendation(
    baseInput
);

assert.equal(
    goResult.recommendation,
    'GO'
);

assert.ok(
    goResult.reasons.length > 0,
    'GO must include explanation reasons.'
);

assert.ok(
    goResult.actions.length > 0,
    'GO must include actionable guidance.'
);

// ---------- Test 2: CONDITIONAL GO ----------

const conditionalResult =
    generateReleaseRecommendation({
        ...baseInput,

        releaseQuality: {
            available: true,
            qualityScore: 85
        }
    });

assert.equal(
    conditionalResult.recommendation,
    'CONDITIONAL GO'
);

// ---------- Test 3: NO-GO Due to Failed Tests ----------

const failedTestResult =
    generateReleaseRecommendation({
        ...baseInput,

        releaseQuality: {
            available: true,
            qualityScore: 99
        },

        execution: {
            executedTests: 100,
            failedTests: 1,
            failureRate: 1
        }
    });

assert.equal(
    failedTestResult.recommendation,
    'NO-GO',
    'A high score must not override failed tests.'
);

// ---------- Test 4: NO-GO Due to Critical Module ----------

const criticalModuleResult =
    generateReleaseRecommendation({
        ...baseInput,

        modules: [
            {
                application: 'SauceDemo',
                module: 'checkout',
                healthScore: 40,
                riskLevel: 'Critical'
            }
        ]
    });

assert.equal(
    criticalModuleResult.recommendation,
    'NO-GO'
);

// ---------- Test 5: NO-GO Due to Failure Rate ----------

const highFailureRateResult =
    generateReleaseRecommendation({
        ...baseInput,

        execution: {
            executedTests: 100,
            failedTests: 0,
            failureRate: 6
        }
    });

assert.equal(
    highFailureRateResult.recommendation,
    'NO-GO'
);

// ---------- Test 6: NO-GO Due to Quality Gate ----------

const failedGateResult =
    generateReleaseRecommendation({
        ...baseInput,

        qualityGate: {
            configured: true,
            status: 'FAILED'
        }
    });

assert.equal(
    failedGateResult.recommendation,
    'NO-GO'
);

// ---------- Test 7: REVIEW REQUIRED - Missing RQS ----------

const missingQualityResult =
    generateReleaseRecommendation({
        ...baseInput,

        releaseQuality: {
            available: false,
            qualityScore: null
        }
    });

assert.equal(
    missingQualityResult.recommendation,
    'REVIEW REQUIRED'
);

// ---------- Test 8: REVIEW REQUIRED - Missing TSI ----------

const missingStabilityResult =
    generateReleaseRecommendation({
        ...baseInput,

        testStability: {
            available: false,
            score: null
        }
    });

assert.equal(
    missingStabilityResult.recommendation,
    'REVIEW REQUIRED'
);

// ---------- Test 9: REVIEW REQUIRED - Missing Modules ----------

const missingModulesResult =
    generateReleaseRecommendation({
        ...baseInput,

        modules: []
    });

assert.equal(
    missingModulesResult.recommendation,
    'REVIEW REQUIRED'
);

// ---------- Test 10: REVIEW REQUIRED - Missing Execution ----------

const missingExecutionResult =
    generateReleaseRecommendation({
        ...baseInput,

        execution: null
    });

assert.equal(
    missingExecutionResult.recommendation,
    'REVIEW REQUIRED'
);

// ---------- Test 11: REVIEW REQUIRED - Missing Gate Result ----------

const missingGateResult =
    generateReleaseRecommendation({
        ...baseInput,

        qualityGate: {
            configured: true,
            status: 'UNKNOWN'
        }
    });

assert.equal(
    missingGateResult.recommendation,
    'REVIEW REQUIRED'
);

// ---------- Test 12: Conditional GO - Gate Warning ----------

const warningGateResult =
    generateReleaseRecommendation({
        ...baseInput,

        qualityGate: {
            configured: true,
            status: 'WARNING'
        }
    });

assert.equal(
    warningGateResult.recommendation,
    'CONDITIONAL GO'
);

// ---------- Test 13: Boundary Test ----------

const health50Result = generateReleaseRecommendation({
    ...baseInput,
    modules: [
        {
            application: 'SauceDemo',
            module: 'boundary',
            healthScore: 50,
            riskLevel: '🟠 High'
        }
    ]
});

assert.equal(
    health50Result.recommendation,
    'CONDITIONAL GO',
    'A Module Health Score of 50 is Needs Attention, not a critical hard stop.'
);

const healthBelow50Result = generateReleaseRecommendation({
    ...baseInput,
    modules: [
        {
            application: 'SauceDemo',
            module: 'critical-boundary',
            healthScore: 49.99,
            riskLevel: '🔴 Critical'
        }
    ]
});

assert.equal(
    healthBelow50Result.recommendation,
    'NO-GO',
    'A Module Health Score below 50 must trigger a critical hard stop.'
);

// ---------- Test 14: Every Result Has Explanations ----------

const results = [
    goResult,
    conditionalResult,
    failedTestResult,
    criticalModuleResult,
    highFailureRateResult,
    failedGateResult,
    missingQualityResult,
    missingStabilityResult,
    missingModulesResult,
    missingExecutionResult,
    missingGateResult,
    warningGateResult,
    health50Result
];

for (const result of results) {
    assert.ok(
        result.explanation,
        'Every recommendation must include an explanation.'
    );

    assert.ok(
        Array.isArray(result.reasons),
        'Every recommendation must include reasons.'
    );

    assert.ok(
        Array.isArray(result.actions),
        'Every recommendation must include remediation actions.'
    );
}

console.log('🤖 Release Recommendation Tests');
console.log('✅ All 14 Release Recommendation tests passed.');