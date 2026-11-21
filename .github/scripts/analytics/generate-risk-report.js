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

// Import functions from test-aggregation.js
const {
    createStatusCounts,
    addTestStatus,
    countTests
} = require('../core/test-aggregation');

// Import functions from report-utils.js
const {
    escapeMarkdown,
    writeMarkdown
} = require('../reporting/report-utils');

// ---------- Initialize Test Collections ----------
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
    const key = `${test.application}::${test.module}`;

    moduleRiskCounts[key] =
        moduleRiskCounts[key] ||
        createStatusCounts({
            application: test.application,
            module: test.module,
            executed: 0,
            durationMs: 0,
            durationTestCount: 0
        });

    const module = moduleRiskCounts[key];

    addTestStatus(module, test.status);

    // Exclude skipped tests from module risk denominators.
    if (test.status !== 'skipped') {
        module.executed++;
    }

    // Normalized duration includes all retry attempts.
    module.durationMs += test.durationMs;

    if (test.durationMs > 0) {
        module.durationTestCount++;
    }

    // Count failed tests by application and module.
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

// ---------- Slowest Module Analysis ----------
const slowestModules = Object.values(moduleRiskCounts)
    .filter(item => item.durationMs > 0)
    .map(item => ({
        ...item,
        averageDurationMs: item.durationTestCount > 0
            ? item.durationMs / item.durationTestCount
            : 0
    }))
    .sort((a, b) =>
        b.durationMs - a.durationMs ||
        b.averageDurationMs - a.averageDurationMs ||
        a.application.localeCompare(b.application) ||
        a.module.localeCompare(b.module)
    );

const slowestModule = slowestModules[0] || null;

// formatDuration: Format duration to seconds
function formatDuration(ms) {
    return `${(ms / 1000).toFixed(2)}s`;
}

console.log('Slowest Module Analysis:');

if (slowestModule) {
    console.log(
        `Slowest Module: ${slowestModule.application} / ${slowestModule.module}`
    );

    console.log(
        `Total Duration: ${formatDuration(slowestModule.durationMs)}`
    );

    console.log(
        `Average Duration: ${formatDuration(slowestModule.averageDurationMs)}`
    );
} else {
    console.log('No execution duration data found.');
}
// ---------- ----------

// ---------- Module Risk Analysis ----------
const riskModules = Object.values(moduleRiskCounts).map(item => {

    const failureRate = item.executed > 0
        ? (item.failed / item.executed) * 100
        : 0;

    const flakyRate = item.executed > 0
        ? (item.flaky / item.executed) * 100
        : 0;

    // formula: [Risk = (FailureRate \times 0.70) + (FlakyRate \times 0.30)\]
    const riskScore = Math.min(
        100,
        (failureRate * 0.70) + (flakyRate * 0.30)
    );

    let riskLevel = '🟢 Healthy';

    if (riskScore >= 50) {
        riskLevel = '🔴 Critical';
    } else if (riskScore >= 25) {
        riskLevel = '🟠 High';
    } else if (riskScore >= 10) {
        riskLevel = '🟡 Moderate';
    } else if (riskScore > 0) {
        riskLevel = '🔵 Low';
    }

    return {
        ...item,
        failureRate,
        flakyRate,
        riskScore,
        riskLevel
    };
});

// Rank Modules
riskModules.sort((a, b) =>
    b.riskScore - a.riskScore ||
    b.failed - a.failed ||
    b.flaky - a.flaky ||
    a.application.localeCompare(b.application) ||
    a.module.localeCompare(b.module)
);

const topRiskModules = riskModules.slice(0, 10);
const topRiskModule = topRiskModules[0] || null;

// Risk Summary
const totalModulesAnalyzed = riskModules.length;

const highRiskModuleCount = riskModules.filter(
    item => item.riskScore >= 25
).length;

const criticalRiskModuleCount = riskModules.filter(
    item => item.riskScore >= 50
).length;

console.log('Module Risk Analysis:');
console.log(`Total Modules: ${totalModulesAnalyzed}`);
console.log(`High/Critical Risk Modules: ${highRiskModuleCount}`);
console.log(`Critical Risk Modules: ${criticalRiskModuleCount}`);
// ---------- ----------

// ---------- Markdown ----------
const modules = Object.values(failedModuleCounts)
    .sort((a, b) =>
        a.application.localeCompare(b.application) ||
        a.module.localeCompare(b.module)
    );

// Failed Modules Markdown
const failedModuleMarkdown = [
    '| Application | Module | Failed Tests |',
    '|:-------------:|:--------:|:-------------:|',
    ...(modules.length
        ? modules.map(item =>
            `| ${escapeMarkdown(item.application)} | ${escapeMarkdown(item.module)} | ${item.count} |`
        )
        : ['| N/A | No failed modules | 0 |'])
].join('\n');

writeMarkdown(
    'failed-modules.md',
    failedModuleMarkdown
);

// Failed Tests Markdown
const failedTestMarkdown = [
    '| Application | Module | Test Case | Project | Retries |',
    '|:-------------:|:--------:|:-----------:|:---------:|:--------:|',
    ...(failedTests.length
        ? failedTests.map(test =>
            `| ${escapeMarkdown(test.application)} | ${escapeMarkdown(test.module)} | ${escapeMarkdown(test.title)} | ${escapeMarkdown(test.project)} | ${test.retries} |`
        )
        : ['| N/A | N/A | No failed tests | N/A | 0 |'])
].join('\n');

writeMarkdown(
    'failed-tests.md',
    failedTestMarkdown
);

// Flaky Tests Markdown
const flakyTestMarkdown = [
    '| Application | Module | Test Case | Project | Retries |',
    '|:-------------:|:--------:|:-----------:|:---------:|:--------:|',
    ...(flakyTests.length
        ? flakyTests.map(test =>
            `| ${escapeMarkdown(test.application)} | ${escapeMarkdown(test.module)} | ${escapeMarkdown(test.title)} | ${escapeMarkdown(test.project)} | ${test.retries} |`
        )
        : ['| N/A | N/A | No flaky tests | N/A | 0 |'])
].join('\n');

writeMarkdown(
    'flaky-tests.md',
    flakyTestMarkdown
);
// Top Risk Modules Markdown
const topRiskMarkdown = [
    '',
    '> Application modules ranked by weighted failure and flaky rates.',
    '',
    '### 📊 Risk Overview',
    '',
    '| Metric | Value |',
    '|:---:|:---:|',
    `| Total Modules Analyzed | ${totalModulesAnalyzed} |`,
    `| Modules Ranked | ${topRiskModules.length} |`,
    `| High/Critical Risk Modules | ${highRiskModuleCount} |`,
    `| Critical Risk Modules | ${criticalRiskModuleCount} |`,
    '',
    '### 🏆 Top 10 Highest-Risk Modules',
    '',
    '| Rank | Application | Module | Total | Executed | Failed | Flaky | Failure Rate | Flaky Rate | Risk Score | Risk Level |',
    '|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|',
    ...(topRiskModules.length
        ? topRiskModules.map((item, index) =>
            `| #${index + 1} | ${escapeMarkdown(item.application)} | ${escapeMarkdown(item.module)} | ${item.total} | ${item.executed} | ${item.failed} | ${item.flaky} | ${item.failureRate.toFixed(2)}% | ${item.flakyRate.toFixed(2)}% | ${item.riskScore.toFixed(2)}% | ${item.riskLevel} |`
        )
        : [
            '| - | N/A | No modules found | 0 | 0 | 0 | 0 | 0.00% | 0.00% | 0.00% | 🟢 Healthy |'
        ]),
    '',
    '#### 🧮 Risk Score Calculation',
    '',
    '**Risk Score = (Failure Rate × 70%) + (Flaky Rate × 30%)**',
    '',
    '- Failure Rate = (Failed Tests / Executed Tests) × 100',
    '- Flaky Rate = (Flaky Tests / Executed Tests) × 100',
    '- Skipped tests are excluded from the rate denominator.',
    '- Maximum risk score is capped at 100%.',
    '',
    '_Only the top 10 highest-risk modules are displayed._'
].join('\n');

writeMarkdown(
    'top-risk-modules.md',
    topRiskMarkdown
);

// Slowest Module Markdown
const slowestModuleMarkdown = [
    '',
    ...(slowestModule
        ? [
            '| Application | Module | Total Duration | Average Duration | Tests Measured |',
            '|:---:|:---:|:---:|:---:|:---:|',
            `| ${escapeMarkdown(slowestModule.application)} | ${escapeMarkdown(slowestModule.module)} | ${formatDuration(slowestModule.durationMs)} | ${formatDuration(slowestModule.averageDurationMs)} | ${slowestModule.durationTestCount} |`
        ]
        : [
            'No execution duration data available.'
        ])
].join('\n');

writeMarkdown(
    'slowest-module.md',
    slowestModuleMarkdown
);
// ---------- ----------

// ---------- Readiness Metric calculations ----------
const RELEASE_READINESS_CONFIG = {
    failureRateThreshold: 5,
    flakyRateThreshold: 5,
    slowTestThresholdMs: 10000,

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

// Shared Readiness Metrics
const readinessCounts = countTests(tests);

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
    flaky,
    skipped
} = readinessCounts;

// Executed tests exclude skipped tests.
const executed = passed + failed + flaky;

// Use the shared metric calculations.
const {
    passRate,
    failRate: failureRate,
    flakyRate
} = readinessMetrics;

// Module Risk
const highestModuleRisk = riskModules.length > 0
    ? Math.max(...riskModules.map(module => module.riskScore))
    : 0;

// Performance
const averageTestDurationMs = slowestModule
    ? slowestModule.averageDurationMs
    : 0;

// Individual Weighted Scores
const passRateScore =
    (passRate / 100) *
    RELEASE_READINESS_CONFIG.weights.passRate;

const failureRateScore =
    Math.max(0, 100 - failureRate) / 100 *
    RELEASE_READINESS_CONFIG.weights.failureRate;

const flakyRateScore =
    Math.max(
        0,
        100 - (
            flakyRate /
            RELEASE_READINESS_CONFIG.flakyRateThreshold
        ) * 100
    ) / 100 *
    RELEASE_READINESS_CONFIG.weights.flakyRate;

const moduleRiskScore =
    Math.max(0, 100 - highestModuleRisk) / 100 *
    RELEASE_READINESS_CONFIG.weights.moduleRisk;

const performanceScore =
    Math.max(
        0,
        100 - (
            averageTestDurationMs /
            RELEASE_READINESS_CONFIG.slowTestThresholdMs
        ) * 100
    ) / 100 *
    RELEASE_READINESS_CONFIG.weights.performance;

// Final Readiness Score
const readinessScore = Number((
    passRateScore +
    failureRateScore +
    flakyRateScore +
    moduleRiskScore +
    performanceScore
).toFixed(2));

// Release Decision
let readinessStatus;
let readinessReason;

if (executed === 0) {
    readinessStatus = 'NO-GO';
    readinessReason = 'No executed tests were found.';

} else if (
    failureRate > RELEASE_READINESS_CONFIG.failureRateThreshold
) {
    readinessStatus = 'NO-GO';
    readinessReason =
        `Failure rate (${failureRate.toFixed(2)}%) exceeds ` +
        `the ${RELEASE_READINESS_CONFIG.failureRateThreshold}% threshold.`;

} else if (
    readinessScore >= RELEASE_READINESS_CONFIG.decisions.go &&
    failed === 0
) {
    readinessStatus = 'GO';
    readinessReason =
        'All readiness scoring criteria are satisfied.';

} else if (
    readinessScore >= RELEASE_READINESS_CONFIG.decisions.conditionalGo
) {
    readinessStatus = 'CONDITIONAL GO';
    readinessReason =
        'Review outstanding test failures, flaky tests, or risk areas.';

} else {
    readinessStatus = 'NO-GO';
    readinessReason =
        'The readiness score is below the minimum release threshold.';
}

// Final Readiness Result
const releaseReadiness = {
    status: readinessStatus,
    score: readinessScore,
    reason: readinessReason,

    metrics: {
        totalTests: total,
        executedTests: executed,
        passedTests: passed,
        failedTests: failed,
        flakyTests: flaky,
        skippedTests: skipped,
        passRate,
        failureRate,
        flakyRate,
        highestModuleRisk: Number(highestModuleRisk.toFixed(2)),
        averageTestDurationMs: Number(
            averageTestDurationMs.toFixed(2)
        )
    },

    componentScores: {
        passRate: Number(passRateScore.toFixed(2)),
        failureRate: Number(failureRateScore.toFixed(2)),
        flakyRate: Number(flakyRateScore.toFixed(2)),
        moduleRisk: Number(moduleRiskScore.toFixed(2)),
        performance: Number(performanceScore.toFixed(2))
    },

    thresholds: RELEASE_READINESS_CONFIG
};

// Structured source for notification generation
const riskAnalysis = {
    generatedAt: new Date().toISOString(),

    summary: {
        totalModulesAnalyzed,
        highRiskModuleCount,
        criticalRiskModuleCount,
        failedModuleCount: modules.length,
        failedTestCount: failedTests.length,
        flakyTestCount: flakyTests.length
    },

    failedModules: modules,
    failedTests,
    flakyTests,

    topRiskModules,
    topRiskModule,

    slowestModule,

    releaseReadiness
};

fs.writeFileSync(
    'risk-analysis.json',
    JSON.stringify(riskAnalysis, null, 2),
    'utf8'
);

// Readiness Markdown
const readinessStatusEmoji = {
    'GO': '🟢',
    'CONDITIONAL GO': '🟡',
    'NO-GO': '🔴'
}[releaseReadiness.status] || '⚪';

const readinessMarkdown = `### ${readinessStatusEmoji} ${releaseReadiness.status}
*Readiness Score:* ${releaseReadiness.score}/100

${releaseReadiness.reason}

### Scoring Breakdown

| Category | Actual Rate | Weight | Points |
|:---:|:---:|:---:|:---:|
| Test Pass Rate | ${passRate.toFixed(2)}% | 40% | ${passRateScore.toFixed(2)} |
| Failure Rate | ${failureRate.toFixed(2)}% | 25% | ${failureRateScore.toFixed(2)} |
| Flaky Rate | ${flakyRate.toFixed(2)}% | 15% | ${flakyRateScore.toFixed(2)} |
| Module Risk | ${highestModuleRisk.toFixed(2)}% | 10% | ${moduleRiskScore.toFixed(2)} |
| Performance | ${formatDuration(averageTestDurationMs)} | 10% | ${performanceScore.toFixed(2)} |
| **Total** | — | **100%** | **${readinessScore.toFixed(2)}/100** |
`;

// Write Readiness Reports
writeMarkdown(
    'release-readiness.md',
    readinessMarkdown
);

fs.writeFileSync(
    'release-readiness.json',
    JSON.stringify(releaseReadiness, null, 2),
    'utf8'
);
// ---------- ----------

// Logs
console.log(`Failed modules: ${modules.length}`);
console.log(`Failed tests: ${failedTests.length}`);
console.log(`Flaky tests: ${flakyTests.length}`);
console.log(`Total modules analyzed: ${totalModulesAnalyzed}`);
console.log(`Release readiness: ${releaseReadiness.status}`);
console.log(`Readiness score: ${releaseReadiness.score}/100`);