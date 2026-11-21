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

    moduleRiskCounts[key] = moduleRiskCounts[key] || {
        application: test.application,
        module: test.module,
        total: 0,
        executed: 0,
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
        durationMs: 0,
        durationTestCount: 0
    };

    const module = moduleRiskCounts[key];

    module.total++;
    module[test.status]++;

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

// ---------- escapeMarkdown() ----------
// escapeMarkdown: Markdown formatting
function escapeMarkdown(value) {
    return String(value || 'N/A')
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ')
        .trim();
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

fs.writeFileSync(
    'failed-modules.md',
    failedModuleMarkdown + '\n'
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

fs.writeFileSync(
    'failed-tests.md',
    failedTestMarkdown + '\n'
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

fs.writeFileSync(
    'flaky-tests.md',
    flakyTestMarkdown + '\n'
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

fs.writeFileSync(
    'top-risk-modules.md',
    topRiskMarkdown + '\n'
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

fs.writeFileSync(
    'slowest-module.md',
    slowestModuleMarkdown + '\n'
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
fs.writeFileSync(
    'release-readiness.md',
    readinessMarkdown,
    'utf8'
);

fs.writeFileSync(
    'release-readiness.json',
    JSON.stringify(releaseReadiness, null, 2),
    'utf8'
);
// ---------- ----------

// ---------- Slack-Specific Formatting ----------
// Group failed modules by application.
const groupedModules = {};

for (const item of modules) {
    groupedModules[item.application] =
        groupedModules[item.application] || [];

    groupedModules[item.application].push(
        `   • \`${item.module}\` — ${item.count} failed test${item.count === 1 ? '' : 's'}`
    );
}

const failedModulesSlack = modules.length
    ? Object.entries(groupedModules)
        .map(([application, items]) =>
            `• *${application}*\n${items.join('\n')}`
        )
        .join('\n\n')
    : 'No failed modules.';

// Failed tests.
const failedTestsSlack = failedTests.length
    ? failedTests.slice(0, 10).map(test =>
        `• *${test.application} / ${test.module}*\n   - ${test.title}`
    ).join('\n')
        + (failedTests.length > 10
            ? `\n…and ${failedTests.length - 10} more failed tests.`
            : '')
    : 'No failed tests.';

// Flaky tests.
const flakyTestsSlack = flakyTests.length
    ? flakyTests.slice(0, 10).map(test =>
        `• *${test.application} / ${test.module}*\n   - ${test.title} (Retries: ${test.retries})`
    ).join('\n')
        + (flakyTests.length > 10
            ? `\n…and ${flakyTests.length - 10} more flaky tests.`
            : '')
    : 'No flaky tests.';

// Top risk module.
const topRiskModuleSlack = topRiskModule
    ? [
        `🚩 *${topRiskModule.application} / ${topRiskModule.module}*`,
        `• Failed: ${topRiskModule.failed}`,
        `• Flaky: ${topRiskModule.flaky}`,
        `• Failure Rate: ${topRiskModule.failureRate.toFixed(2)}%`,
        `• Flaky Rate: ${topRiskModule.flakyRate.toFixed(2)}%`,
        `• Risk Score: *${topRiskModule.riskScore.toFixed(2)}%*`,
        `• Risk Level: ${topRiskModule.riskLevel}`
    ].join('\n')
    : 'No modules found.';

// Slowest module.
const slowestModuleSlack = slowestModule
    ? [
        `🐢 *${slowestModule.application} / ${slowestModule.module}*`,
        `• Total Duration: *${formatDuration(slowestModule.durationMs)}*`,
        `• Average Duration: ${formatDuration(slowestModule.averageDurationMs)}`,
        `• Tests Measured: ${slowestModule.durationTestCount}`,
        `• Failed: ${slowestModule.failed}`,
        `• Flaky: ${slowestModule.flaky}`
    ].join('\n')
    : 'No execution duration data available.';

// Release readiness
const releaseReadinessSlack = [
    `${readinessStatusEmoji} *${releaseReadiness.status}*`,
    `*Reason:* ${releaseReadiness.reason}`,
    `*Readiness Score:* ${releaseReadiness.score}/100`,
    '• Category | Actual Rate | Weight | Points',
    `• Test Pass Rate: ${passRate.toFixed(2)}% | 40% | ${passRateScore.toFixed(2)}`,
    `• Failure Rate: ${failureRate.toFixed(2)}% | 25% | ${failureRateScore.toFixed(2)}`,
    `• Flaky Rate: ${flakyRate.toFixed(2)}% | 15% | ${flakyRateScore.toFixed(2)}`,
    `• Module Risk: ${highestModuleRisk.toFixed(2)}% | 10% | ${moduleRiskScore.toFixed(2)}`,
    `• Performance: ${formatDuration(averageTestDurationMs)} | 10% | ${performanceScore.toFixed(2)}`,
    `• Total: 100% | ${readinessScore.toFixed(2)}/100`
].join('\n');

// setOutput(): GitHub Actions Outputs
function setOutput(name, value) {
    // Allow local execution without GitHub Actions.
    if (!process.env.GITHUB_OUTPUT) {
        return;
    }

    const delimiter = `EOF_${name}`;

    fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `${name}<<${delimiter}\n${value}\n${delimiter}\n`
    );
}

// Slack outputs: keep the existing names.
setOutput('RELEASE_READINESS_TEXT', releaseReadinessSlack);
setOutput('TOP_RISK_MODULE_TEXT', topRiskModuleSlack);
setOutput('FAILED_MODULE_TEXT', failedModulesSlack);
setOutput('FAILED_TEST_TEXT', failedTestsSlack);
setOutput('FLAKY_TEST_TEXT', flakyTestsSlack);
setOutput('SLOWEST_MODULE_TEXT', slowestModuleSlack);

// Release readiness outputs.
setOutput('RELEASE_READINESS_STATUS', releaseReadiness.status);
setOutput('RELEASE_READINESS_SCORE', String(releaseReadiness.score));
setOutput('RELEASE_READINESS_REASON', releaseReadiness.reason);
setOutput(
    'RELEASE_READINESS_JSON',
    JSON.stringify(releaseReadiness, null, 2)
);

// Titles.
setOutput('ISSUE_TITLE', process.env.ISSUE_TITLE || 'N/A');
setOutput('PR_TITLE', process.env.PR_TITLE || 'N/A');

// Logs
console.log(`Failed modules: ${modules.length}`);
console.log(`Failed tests: ${failedTests.length}`);
console.log(`Flaky tests: ${flakyTests.length}`);
console.log(`Total modules analyzed: ${totalModulesAnalyzed}`);
console.log(`Release readiness: ${releaseReadiness.status}`);
console.log(`Readiness score: ${releaseReadiness.score}/100`);
// ---------- ----------