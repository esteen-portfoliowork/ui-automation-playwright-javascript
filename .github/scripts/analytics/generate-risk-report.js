// Risk analysis and release readiness

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

const failedTests = tests.filter(
    test => test.status === 'failed'
);

const flakyTests = tests.filter(
    test => test.status === 'flaky'
);

const failedModuleCounts = {};
const moduleRiskCounts = {};
// ---------- ----------

// ---------- Build module metrics from normalized tests ----------
for (const test of tests) {
    const key =
        `${test.application}::${test.module}`;

    moduleRiskCounts[key] = moduleRiskCounts[key] || {
        application: test.application,
        module: test.module,
        total: 0,
        executed: 0,
        failed: 0,
        flaky: 0,
        passed: 0,
        skipped: 0,
        durationMs: 0,
        durationTestCount: 0
    };

    const module = moduleRiskCounts[key];

    module.total++;
    module[test.status]++;

    if (test.status !== 'skipped') {
        module.executed++;
    }

    module.durationMs += test.durationMs;

    if (test.durationMs > 0) {
        module.durationTestCount++;
    }

    if (test.status === 'failed') {
        failedModuleCounts[key] =
            failedModuleCounts[key] || {
                application: test.application,
                module: test.module,
                count: 0
            };

        failedModuleCounts[key].count++;
    }
}
// ---------- ----------

// ---------- Readiness Metric calculations ----------
const RELEASE_READINESS_CONFIG = {
    failureRateThreshold: 5,       // NO-GO when failure rate exceeds 5%
    flakyRateThreshold: 5,         // 5% flaky rate reaches zero flaky score
    slowTestThresholdMs: 10000,    // 10 seconds average duration per test
    weights: {
        passRate: 40,
        failureRate: 25,
        flakyRate: 15,
        moduleRisk: 10,
        performance: 10
    },
    decisions: {
        go: 90,
        conditionalGo: 75
    }
};

const readinessCounts = tests.reduce(
    (counts, test) => {
        counts.total++;
        counts[test.status]++;
        return counts;
    },
    {
        total: 0,
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0
    }
);

const readinessMetrics = calculateMetrics(
    readinessCounts.total,
    readinessCounts.passed,
    readinessCounts.failed,
    readinessCounts.flaky,
    readinessCounts.skipped
);

const {
    total,
    passed,
    failed,
    flaky
} = readinessCounts;

const {
    passRate,
    failRate: failureRate,
    flakyRate
} = readinessMetrics;
// ---------- ----------