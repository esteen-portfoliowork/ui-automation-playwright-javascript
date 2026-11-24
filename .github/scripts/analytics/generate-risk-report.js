// Risk analysis and release readiness

// Import fs
const fs = require('fs');

// Import functions from quality-scoring.js
const {
    calculateTestStabilityIndex,
    calculateModuleHealthScore,
    getModuleHealthStatus,
    calculateReleaseQualityScore
} = require('../core/quality-scoring');

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

const historyPath = 'history/previous-summary.json';

const historyData = fs.existsSync(historyPath)
    ? JSON.parse(fs.readFileSync(historyPath, 'utf8'))
    : { runs: [] };

const testStabilityIndex =
    calculateTestStabilityIndex(
        historyData.runs || []
    );
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

    // formula: [riskScore = (FailureRate \times 0.70) + (FlakyRate \times 0.30)\]
    const riskScore = Math.min(
        100,
        (failureRate * 0.70) + (flakyRate * 0.30)
    );

    // formula: healthScore = 100 - riskScore
    const healthScore = calculateModuleHealthScore(
        riskScore,
        item.executed
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
        riskLevel,

        healthScore,
        healthStatus: getModuleHealthStatus(healthScore)
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

const failedModuleMarkdown = modules.length
    ? [
        '| Application | Module | Failed Tests | Module Risk Score | Module Health Score | Health Status |',
        '|:-------------:|:--------:|:-------------:|:----------------:|:-----------------:|:-------------:|',

        ...modules.map(item => {
            const riskModule = riskModules.find(
                module =>
                    module.application === item.application &&
                    module.module === item.module
            );

            const riskScore = riskModule
                ? `${riskModule.riskScore.toFixed(2)}%`
                : 'N/A';

            const healthScore =
                riskModule?.healthScore !== null &&
                riskModule?.healthScore !== undefined
                    ? `${riskModule.healthScore.toFixed(2)}%`
                    : 'N/A';

            const healthStatus =
                riskModule?.healthStatus || '⚪ Unknown';

            return (
                `| ${escapeMarkdown(item.application)} | ` +
                `${escapeMarkdown(item.module)} | ` +
                `${item.count} | ${riskScore} | ` +
                `${healthScore} | ${healthStatus} |`
            );
        })
    ].join('\n')
    : '✅ No failed modules found.';

writeMarkdown(
    'failed-modules.md',
    failedModuleMarkdown
);

// Failed Tests Markdown
const failedTestMarkdown = failedTests.length
    ? [
        '| Application | Module | Test Case | Project | Retries |',
        '|:-------------:|:--------:|:-----------:|:---------:|:--------:|',
        ...failedTests.map(test =>
            `| ${escapeMarkdown(test.application)} | ${escapeMarkdown(test.module)} | ${escapeMarkdown(test.title)} | ${escapeMarkdown(test.project)} | ${test.retries} |`
        )
    ].join('\n')
    : '✅ No failed tests found.';

writeMarkdown(
    'failed-tests.md',
    failedTestMarkdown
);

// Flaky Tests Markdown
const flakyTestMarkdown = flakyTests.length
    ? [
        '| Application | Module | Test Case | Project | Retries |',
        '|:-------------:|:--------:|:-----------:|:---------:|:--------:|',
        ...flakyTests.map(test =>
            `| ${escapeMarkdown(test.application)} | ${escapeMarkdown(test.module)} | ${escapeMarkdown(test.title)} | ${escapeMarkdown(test.project)} | ${test.retries} |`
        )
    ].join('\n')
    : '✅ No flaky tests found.';

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
    ...(topRiskModules.length
        ? [
            '| Rank | Application | Module | Total | Executed | Failed | Flaky | Failure Rate | Flaky Rate | Module Risk Score | Module Health Score | Risk Level | Health Status |',
            '|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|',
            ...topRiskModules.map((item, index) =>
                `| #${index + 1} | ${escapeMarkdown(item.application)} | ${escapeMarkdown(item.module)} | ${item.total} | ${item.executed} | ${item.failed} | ${item.flaky} | ${item.failureRate.toFixed(2)}% | ${item.flakyRate.toFixed(2)}% | ${item.riskScore.toFixed(2)}% | ${item.healthScore === null ? 'N/A' : `${item.healthScore.toFixed(2)}%`} | ${item.riskLevel} | ${item.healthStatus} |`
            )
        ]
        : [
            'No modules available for risk analysis.'
        ]),
    '',
    '#### 🧮 Module Risk & Health Score Calculation',
    '',
    '**Module Risk Score = (Failure Rate × 70%) + (Flaky Rate × 30%)**',
    '',
    '**Module Health Score = 100 − Module Risk Score**',
    '',
    '- Failure Rate = (Failed Tests / Executed Tests) × 100',
    '- Flaky Rate = (Flaky Tests / Executed Tests) × 100',
    '- Skipped tests are excluded from the rate denominator.',
    '- Maximum Module Risk Score is capped at 100%.',
    '- Module Health Score is unavailable when a module has no executed tests.',
    '',
    '**Module Health Status:**',
    '- 90–100: 🟢 Healthy',
    '- 75–89: 🔵 Good',
    '- 50–74: 🟡 Needs Attention',
    '- 0–49: 🔴 Critical',
    '',
    '_Only the top 10 highest-risk modules are displayed._'
].join('\n');

writeMarkdown(
    'top-risk-modules.md',
    topRiskMarkdown
);

// Slowest Module Markdown

const slowestRiskModule = slowestModule
    ? riskModules.find(
        module =>
            module.application === slowestModule.application &&
            module.module === slowestModule.module
    )
    : null;

const slowestModuleMarkdown = [
    '',
    ...(slowestModule
        ? [
            '| Application | Module | Total Duration | Average Duration | Tests Measured | Module Risk Score | Module Health Score | Health Status |',
            '|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|',

            `| ${escapeMarkdown(slowestModule.application)} | ${escapeMarkdown(slowestModule.module)} | ${formatDuration(slowestModule.durationMs)} | ${formatDuration(slowestModule.averageDurationMs)} | ${slowestModule.durationTestCount} | ${slowestRiskModule ? `${slowestRiskModule.riskScore.toFixed(2)}%` : 'N/A'} | ${slowestRiskModule?.healthScore !== null && slowestRiskModule?.healthScore !== undefined ? `${slowestRiskModule.healthScore.toFixed(2)}%` : 'N/A'} | ${slowestRiskModule?.healthStatus || '⚪ Unknown'} |`
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


// ---------- Release Quality Score ----------

const RELEASE_QUALITY_CONFIG = {
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

// ---------- Execution Metrics ----------

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

const executed = passed + failed + flaky;

const {
    passRate,
    failRate: failureRate,
    flakyRate
} = readinessMetrics;

// ---------- Module Health ----------

// Get the weakest Module Health Score.
// This is the inverse of the highest Module Risk Score.

const validHealthModules = riskModules.filter(
    module =>
        Number.isFinite(module.healthScore)
);

const lowestModuleHealthScore =
    validHealthModules.length > 0
        ? Math.min(
            ...validHealthModules.map(
                module => module.healthScore
            )
        )
        : null;

// ---------- Performance ----------

// Preserve the existing performance measurement:
// average duration of the slowest module.

const averageTestDurationMs =
    slowestModule &&
    slowestModule.durationTestCount > 0
        ? slowestModule.averageDurationMs
        : null;

// ---------- Centralized Quality Calculation ----------

const releaseQuality = calculateReleaseQualityScore({

    executedTests: executed,

    passRate,
    failureRate,
    flakyRate,

    testStabilityIndex,

    modules: riskModules,

    averageTestDurationMs,

    weights: RELEASE_QUALITY_CONFIG.weights,

    flakyRateThreshold:
        RELEASE_QUALITY_CONFIG.flakyRateThreshold,

    slowTestThresholdMs:
        RELEASE_QUALITY_CONFIG.slowTestThresholdMs
});

const qualityScore = releaseQuality.qualityScore;

// ---------- Release Decision ----------

let readinessStatus;
let readinessReason;

if (!releaseQuality.available) {

    readinessStatus = 'UNKNOWN';
    readinessReason = releaseQuality.reason;

} else if (
    failureRate >
    RELEASE_QUALITY_CONFIG.failureRateThreshold
) {

    readinessStatus = 'NO-GO';

    readinessReason =
        `Failure rate (${failureRate.toFixed(2)}%) exceeds ` +
        `the ${RELEASE_QUALITY_CONFIG.failureRateThreshold}% threshold.`;

} else if (
    qualityScore >= RELEASE_QUALITY_CONFIG.decisions.go &&
    failed === 0
) {

    readinessStatus = 'GO';

    readinessReason =
        'All release quality criteria are satisfied.';

} else if (
    qualityScore >=
    RELEASE_QUALITY_CONFIG.decisions.conditionalGo
) {

    readinessStatus = 'CONDITIONAL GO';

    readinessReason =
        'Review outstanding test failures, flaky tests, or risk areas.';

} else {

    readinessStatus = 'NO-GO';

    readinessReason =
        'Release Quality Score is below the minimum release threshold.';
}

// ---------- Final Release Quality Result ----------

const releaseReadiness = {

    available: releaseQuality.available,

    status: readinessStatus,

    // Canonical score field.
    qualityScore,

    // Backward compatibility.
    score: qualityScore,

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

        highestModuleRisk:
            validHealthModules.length > 0
                ? Number(
                    Math.max(
                        ...validHealthModules.map(
                            module => module.riskScore
                        )
                    ).toFixed(2)
                )
                : null,

        lowestModuleHealthScore,

        averageTestDurationMs,

        testStabilityIndex:
            testStabilityIndex.available
                ? testStabilityIndex.score
                : null
    },

    componentQualityScores:
        releaseQuality.componentQualityScores || null,

    componentScores:
        releaseQuality.componentScores || null,

    componentWeights:
        RELEASE_QUALITY_CONFIG.weights,

    stabilityIntegration:
        releaseQuality.stabilityIntegration || null,

    moduleHealthIntegration:
        releaseQuality.moduleHealthIntegration || null,

    thresholds: RELEASE_QUALITY_CONFIG
};

// ---------- ----------

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

    // Include every analyzed module for downstream reports.
    modules: riskModules,

    topRiskModules,
    topRiskModule,

    slowestModule,

    testStabilityIndex,

    releaseReadiness
};

fs.writeFileSync(
    'risk-analysis.json',
    JSON.stringify(riskAnalysis, null, 2),
    'utf8'
);


// ---------- Release Quality Markdown ----------

const readinessStatusEmoji = {
    'GO': '🟢',
    'CONDITIONAL GO': '🟡',
    'NO-GO': '🔴',
    'UNKNOWN': '⚪'
}[releaseReadiness.status] || '⚪';

const readinessMarkdown = releaseReadiness.available
    ? `### ${readinessStatusEmoji} Release Quality: ${releaseReadiness.status}

**Release Quality Score:** ${releaseReadiness.qualityScore}/100

${releaseReadiness.reason}

### Component Scoring Breakdown

| Component | Actual Metric | Component Quality | Weight | Weighted Points |
|:---:|:---:|:---:|:---:|:---:|
| Pass Rate | ${passRate.toFixed(2)}% | ${releaseQuality.componentQualityScores.passRate.toFixed(2)} | 40% | ${releaseQuality.componentScores.passRate.toFixed(2)} |
| Failure Rate | ${failureRate.toFixed(2)}% | ${releaseQuality.componentQualityScores.failureRate.toFixed(2)} | 25% | ${releaseQuality.componentScores.failureRate.toFixed(2)} |
| Flaky Rate | ${flakyRate.toFixed(2)}% | ${releaseQuality.componentQualityScores.flakyRate.toFixed(2)} | 15% | ${releaseQuality.componentScores.flakyRate.toFixed(2)} |
| Module Health | ${lowestModuleHealthScore.toFixed(2)}% | ${releaseQuality.componentQualityScores.moduleHealth.toFixed(2)} | 10% | ${releaseQuality.componentScores.moduleHealth.toFixed(2)} |
| Performance | ${formatDuration(averageTestDurationMs)} | ${releaseQuality.componentQualityScores.performance.toFixed(2)} | 10% | ${releaseQuality.componentScores.performance.toFixed(2)} |
| **Total** | — | — | **100%** | **${releaseReadiness.qualityScore.toFixed(2)}/100** |

### Additional Quality Indicators

| Indicator | Value |
|:---:|:---:|
| Test Stability Index | ${testStabilityIndex.available ? `${testStabilityIndex.score}/100` : '⚪ Unavailable'} |
| Stability Integration | ${releaseQuality.stabilityIntegration.method} |
| Lowest Module Health Score | ${lowestModuleHealthScore.toFixed(2)}% |
| Modules Analyzed | ${releaseQuality.moduleHealthIntegration.modulesAnalyzed} |

### Scoring Methodology

- Pass Rate: 40% of the total score.
- Failure Rate: 25% of the total score.
- Flaky Rate: 15% of the total score.
- Module Health: 10% of the total score.
- Performance: 10% of the total score.
- Component weights total 100%.
- Historical Test Stability Index is blended into the Flaky Rate component when available.
- Module Health uses the lowest health score among analyzed modules.
- Performance uses the average duration of the slowest module.
`
    : `### ⚪ Release Quality: UNKNOWN

**Release Quality Score:** Unavailable

${releaseReadiness.reason}

The release quality evaluation cannot be completed because one or more required metrics are unavailable.
`;

// ---------- Write Release Quality Reports ----------

// Keep the existing filenames for backward compatibility.

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