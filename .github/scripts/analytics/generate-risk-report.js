// Risk analysis and release readiness
const fs = require('fs');

// ---------- Test Result Collection ----------
const reportPath = 'playwright-report/results.json';
const report = fs.existsSync(reportPath)
? JSON.parse(fs.readFileSync(reportPath, 'utf8'))
: { suites: [] };

// ------- Initialize Test Result Collections -------
const failedTests = [];
const flakyTests = [];
const failedModuleCounts = {};
const moduleRiskCounts = {};

// ------- Application Name Mapping -------
function getAppName(name) {
const applications = {
    'expand-testing': 'Expand Testing',
    'orange-hrm': 'Orange HRM',
    'qa-playground': 'QA Playground',
    'sauce-demo': 'SauceDemo'
};
return applications[name] || name;
}

// ------- Markdown Formatting Utilities -------
function escapeMarkdown(value) {
return String(value || 'N/A')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

// ------- Collect Test Results & Aggregate Module Metrics -------
function walk(suites, parentFile = '') {
for (const suite of suites || []) {
    const file = suite.file || parentFile || 'Unknown';

    for (const spec of suite.specs || []) {
    const specFile = spec.file || file;
    const parts = specFile.replace(/\\/g, '/').split('/');

    const app = parts[0] || 'Unknown';
    const module = (parts[1] || 'Unknown')
        .replace(/\.spec\.(js|ts)$/, '');

    const appName = getAppName(app);
    const tests = spec.tests || [];

    // Aggregate Module Test Metrics
    const key = `${appName}::${module}`;
    moduleRiskCounts[key] = moduleRiskCounts[key] || {
        application: appName,
        module,
        total: 0,
        executed: 0,
        failed: 0,
        flaky: 0,
        durationMs: 0,
        durationTestCount: 0
    };
    const riskItem = moduleRiskCounts[key];
    for (const test of tests) {
        // Count every test entry, including passed and skipped.
        riskItem.total++;

        // Collect execution duration, including retry attempts.
        const results = test.results || [];
        const testDurationMs = results.reduce(
        (total, result) => total + (Number(result.duration) || 0),
        0
        );
        riskItem.durationMs += testDurationMs;
        if (results.length > 0) {
        riskItem.durationTestCount++;
        }

        // Exclude skipped tests from risk-rate calculations.
        if (test.status !== 'skipped') {
        riskItem.executed++;
        }

        // Separate Failed from Flaky
        const isFailed = test.status === 'unexpected';
        const isFlaky = test.status === 'flaky';
        if (isFailed) {
        riskItem.failed++;
        }
        if (isFlaky) {
        riskItem.flaky++;
        }

        // Only collect detailed information for failed/flaky tests.
        if (!isFailed && !isFlaky) continue;
        const testTitle = test.title || spec.title || 'Untitled test';
        const project = test.projectName || 'Default';
        const lastResult = results.at(-1) || {};
        const error =
        lastResult.error?.message ||
        lastResult.errors?.[0]?.message ||
        'No error details available';
        const testDetails = {
        application: appName,
        module,
        title: testTitle,
        project,
        error,
        retries: Math.max(0, results.length - 1)
        };

        // Collect Flaky Tests
        if (isFlaky) {
        flakyTests.push(testDetails);
        continue;
        }

        // Collect Failed Tests
        if (isFailed) {
        failedModuleCounts[key] = failedModuleCounts[key] || {
            application: appName,
            module,
            count: 0
        };
        failedModuleCounts[key].count++;
        failedTests.push(testDetails);
        }
    }
    }

    // Continue traversing nested suites.
    walk(suite.suites, file);
}
}

walk(report.suites || []);

// Reconcile module flaky counts with the Flaky Tests collection.
for (const item of Object.values(moduleRiskCounts)) {
item.flaky = 0;
}
for (const test of flakyTests) {
const key = `${test.application}::${test.module}`;
if (moduleRiskCounts[key]) {
    moduleRiskCounts[key].flaky++;
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

// Get the single slowest module
const slowestModule = slowestModules[0] || null;

// Format milliseconds into readable seconds
function formatDuration(ms) {
return `${(ms / 1000).toFixed(2)}s`;
}

// Slowest Module Log
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

// Calculate Failure Rate
const failureRate = item.executed > 0
    ? (item.failed / item.executed) * 100
    : 0;

// Calculate Flaky Rate
const flakyRate = item.executed > 0
    ? (item.flaky / item.executed) * 100
    : 0;

// Calculate Weighted Risk Score
const riskScore = Math.min(
    100,
    (failureRate * 0.70) + (flakyRate * 0.30)
);

// Assign Risk Level
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

// ------- Rank Modules by Risk -------
riskModules.sort((a, b) =>
b.riskScore - a.riskScore ||
b.failed - a.failed ||
b.flaky - a.flaky ||
a.application.localeCompare(b.application) ||
a.module.localeCompare(b.module)
);

// Get Top 10 Highest-Risk Modules
const topRiskModules = riskModules.slice(0, 10);

// Get the single highest-risk module
const topRiskModule = topRiskModules[0] || null;

// ------- Risk Summary Metrics -------
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

// ---------- Failed Modules, Failed Tests, and Flaky Tests ----------
const modules = Object.values(failedModuleCounts)
.sort((a, b) =>
    a.application.localeCompare(b.application) ||
    a.module.localeCompare(b.module)
);

// Failed Modules Table
const failedModuleMarkdown = [
'| Application | Module | Failed Tests |',
'|:-------------:|:--------:|:-------------:|',
...(modules.length
    ? modules.map(item =>
        `| ${escapeMarkdown(item.application)} | ${escapeMarkdown(item.module)} | ${item.count} |`
    )
    : ['| N/A | No failed modules | 0 |'])
].join('\n');

// Save Markdown report
fs.writeFileSync(
'failed-modules.md',
failedModuleMarkdown + '\n'
);

// ------- Failed Tests Table -------
const failedTestMarkdown = [
'| Application | Module | Test Case | Project | Retries |',
'|:-------------:|:--------:|:-----------:|:---------:|:--------:|',
...(failedTests.length
    ? failedTests.map(test =>
        `| ${escapeMarkdown(test.application)} | ${escapeMarkdown(test.module)} | ${escapeMarkdown(test.title)} | ${escapeMarkdown(test.project)} | ${test.retries} |`
    )
    : ['| N/A | N/A | No failed tests | N/A | 0 |'])
].join('\n');

// Save Markdown report
fs.writeFileSync(
'failed-tests.md',
failedTestMarkdown + '\n'
);

// ------- Flaky Tests Table -------
const flakyTestMarkdown = [
'| Application | Module | Test Case | Project | Retries |',
'|:-------------:|:--------:|:-----------:|:---------:|:--------:|',
...(flakyTests.length
    ? flakyTests.map(test =>
        `| ${escapeMarkdown(test.application)} | ${escapeMarkdown(test.module)} | ${escapeMarkdown(test.title)} | ${escapeMarkdown(test.project)} | ${test.retries} |`
    )
    : ['| N/A | N/A | No flaky tests | N/A | 0 |'])
].join('\n');

// Save Markdown report
fs.writeFileSync(
'flaky-tests.md',
flakyTestMarkdown + '\n'
);
// ---------- ----------

// ---------- risk modules ----------
const topRiskMarkdown = [
'',
'> Application modules ranked by weighted failure and flaky rates.',
'',
'### 📊 Risk Overview',
'',
`| Metric | Value |`,
`|:---:|:---:|`,
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

// Save Markdown report
fs.writeFileSync(
'top-risk-modules.md',
topRiskMarkdown + '\n'
);

// ------- Slowest Module Table -------
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

// Save Markdown report
fs.writeFileSync(
'slowest-module.md',
slowestModuleMarkdown + '\n'
);
// ---------- ----------

// ---------- release Readiness ----------
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

// Aggregate module execution metrics
const readinessMetrics = Object.values(moduleRiskCounts).reduce(
(totals, module) => {
    totals.total += module.total || 0;
    totals.executed += module.executed || 0;
    totals.failed += module.failed || 0;
    totals.flaky += module.flaky || 0;
    return totals;
},
{
    total: 0,
    executed: 0,
    failed: 0,
    flaky: 0
}
);
const {
total,
executed,
failed
} = readinessMetrics;
const flaky = flakyTests.length;

// Note: A flaky test is counted separately from a fully passing test
const passed = Math.max(0, executed - failed - flaky);
const failureRate = executed > 0
? (failed / executed) * 100
: 0;
const flakyRate = executed > 0
? (flaky / executed) * 100
: 0;
const passRate = executed > 0
? (passed / executed) * 100
: 0;

// Highest module risk score
const highestModuleRisk = riskModules.length > 0
? Math.max(...riskModules.map(module => module.riskScore))
: 0;

// Slowest module's average test duration
const averageTestDurationMs = slowestModule
? slowestModule.averageDurationMs
: 0;

// Calculate individual weighted scores
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
const readinessScore = Number((
passRateScore +
failureRateScore +
flakyRateScore +
moduleRiskScore +
performanceScore
).toFixed(2));

// Determine release readiness
let readinessStatus;
let readinessReason;
if (executed === 0) {
readinessStatus = 'NO-GO';
readinessReason = 'No executed tests were found.';
} else if (
failureRate >
RELEASE_READINESS_CONFIG.failureRateThreshold
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

// Final readiness result
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
    passRate: Number(passRate.toFixed(2)),
    failureRate: Number(failureRate.toFixed(2)),
    flakyRate: Number(flakyRate.toFixed(2)),
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

// Release Readiness Report
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

// Save Markdown report
fs.writeFileSync(
'release-readiness.md',
readinessMarkdown,
'utf8'
);

// Save structured JSON report
fs.writeFileSync(
'release-readiness.json',
JSON.stringify(releaseReadiness, null, 2),
'utf8'
);
// ---------- ----------

// ---------- slack-specific formatting ----------
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

// ------- Prepare Slack: Failed Tests -------
const failedTestsSlack = failedTests.length
? failedTests.slice(0, 10).map(test =>
    `• *${test.application} / ${test.module}*\n   - ${test.title}`
    ).join('\n')
    + (failedTests.length > 10
    ? `\n…and ${failedTests.length - 10} more failed tests.`
    : '')
: 'No failed tests.';

// ------- Prepare Slack: Flaky Tests -------
const flakyTestsSlack = flakyTests.length
? flakyTests.slice(0, 10).map(test =>
    `• *${test.application} / ${test.module}*\n   - ${test.title} (Retries: ${test.retries})`
    ).join('\n')
    + (flakyTests.length > 10
    ? `\n…and ${flakyTests.length - 10} more flaky tests.`
    : '')
: 'No flaky tests.';

// ------- Prepare Slack: Top Risk Module -------
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

// ------- Prepare Slack: Slowest Module -------
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

// ------- Prepare Slack: Release Readiness -------
const releaseReadinessSlack = [
`${readinessStatusEmoji} *${releaseReadiness.status}*`,
`*Reason:* ${releaseReadiness.reason}`,
`*Readiness Score:* ${releaseReadiness.score}/100`,
`• Category : | Actual Rate | Weight | Points`,
`• Test Pass Rate: ${passRate.toFixed(2)}% | 40% | ${passRateScore.toFixed(2)}`,
`• Failure Rate: ${failureRate.toFixed(2)}% | 25% | ${failureRateScore.toFixed(2)}`,
`• Flaky Rate: ${flakyRate.toFixed(2)}% | 15% | ${flakyRateScore.toFixed(2)}`,
`• Module Risk: ${highestModuleRisk.toFixed(2)}% | ${moduleRiskScore.toFixed(2)}`,
`• Performance: ${formatDuration(averageTestDurationMs)} | 10% | ${performanceScore.toFixed(2)}`,
`• Total: 100% | ${readinessScore.toFixed(2)}/100`
].join('\n');

// ------- Export GitHub Actions Outputs -------
function setOutput(name, value) {
const delimiter = `EOF_${name}`;
fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `${name}<<${delimiter}\n${value}\n${delimiter}\n`
);
}

// Markdown
// setOutput('TOP_RISK_MARKDOWN', topRiskMarkdown);
// setOutput('TOP_RISK_MARKDOWN', topRiskMarkdown);
// setOutput('FAILED_MODULES_MARKDOWN', failedModuleMarkdown);
// setOutput('FAILED_TESTS_MARKDOWN', failedTestMarkdown);
// setOutput('FLAKY_TESTS_MARKDOWN', flakyTestMarkdown);
// setOutput('SLOWEST_MODULE_MARKDOWN', slowestModuleMarkdown);

// Slack
setOutput('RELEASE_READINESS_TEXT', releaseReadinessSlack);
setOutput('TOP_RISK_MODULE_TEXT', topRiskModuleSlack);
setOutput('FAILED_MODULE_TEXT', failedModulesSlack);
setOutput('FAILED_TEST_TEXT', failedTestsSlack);
setOutput('FLAKY_TEST_TEXT', flakyTestsSlack);
setOutput('SLOWEST_MODULE_TEXT', slowestModuleSlack);

// Release Readiness outputs
setOutput('RELEASE_READINESS_STATUS', releaseReadiness.status);
setOutput('RELEASE_READINESS_SCORE', String(releaseReadiness.score));
setOutput('RELEASE_READINESS_REASON', releaseReadiness.reason);
setOutput('RELEASE_READINESS_JSON', JSON.stringify(releaseReadiness, null, 2));

// Historical Trends
// setOutput('HISTORICAL_TREND_TEXT', historicalTrendSlack);
// setOutput('QUALITY_ANALYTICS_TEXT', qualityAnalyticsSlack);
// setOutput('TEST_CASE_GROWTH_TEXT', testCaseGrowthSlack);

// Titles
setOutput('ISSUE_TITLE', process.env.ISSUE_TITLE || 'N/A');
setOutput('PR_TITLE', process.env.PR_TITLE || 'N/A');

// Logs
console.log(`Failed modules: ${modules.length}`);
console.log(`Failed tests: ${failedTests.length}`);
console.log(`Flaky tests: ${flakyTests.length}`);
// ---------- ----------