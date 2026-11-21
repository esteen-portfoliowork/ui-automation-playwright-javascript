// Notification formatting

// Import fs
const fs = require('fs');

// Import functions from report-utils.js
const {
    setOutput
} = require('./report-utils');

// ---------- Read generated data ----------
function readJson(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(
            `Required reporting data not found: ${filePath}`
        );
    }

    try {
        return JSON.parse(
            fs.readFileSync(filePath, 'utf8')
        );
    } catch (error) {
        throw new Error(
            `Unable to read ${filePath}: ${error.message}`
        );
    }
}

const analytics = readJson('analytics.json');
const risk = readJson('risk-analysis.json');

const historical = fs.existsSync('historical-trend.json')
    ? readJson('historical-trend.json')
    : null;

// ---------- Notification data ----------
const notificationData = {
    generatedAt: new Date().toISOString(),

    execution: analytics.execution,

    applications: analytics.applications,
    modules: analytics.modules,
    tags: analytics.tags,

    failedModules: risk.failedModules,
    failedTests: risk.failedTests,
    flakyTests: risk.flakyTests,

    topRiskModules: risk.topRiskModules,
    topRiskModule: risk.topRiskModule,

    slowestModule: risk.slowestModule,

    releaseReadiness: risk.releaseReadiness,

    historicalTrend: historical
};

// ---------- Formatting helpers ----------
function formatDuration(ms) {
    if (!Number.isFinite(ms)) {
        return 'N/A';
    }

    return `${(ms / 1000).toFixed(2)}s`;
}

function formatFailedModules() {
    const modules = risk.failedModules || [];

    if (modules.length === 0) {
        return 'No failed modules.';
    }

    const grouped = {};

    for (const item of modules) {
        grouped[item.application] =
            grouped[item.application] || [];

        grouped[item.application].push(
            `   • \`${item.module}\` — ${item.count} failed test${item.count === 1 ? '' : 's'}`
        );
    }

    return Object.entries(grouped)
        .map(([application, items]) =>
            `• *${application}*\n${items.join('\n')}`
        )
        .join('\n\n');
}

function formatTests(tests, type) {
    if (!tests.length) {
        return `No ${type} tests.`;
    }

    return tests.slice(0, 10)
        .map(test =>
            `• *${test.application} / ${test.module}*\n` +
            `   - ${test.title}` +
            (type === 'flaky'
                ? ` (Retries: ${test.retries})`
                : '')
        )
        .join('\n') +
        (tests.length > 10
            ? `\n…and ${tests.length - 10} more ${type} tests.`
            : '');
}

function formatTopRiskModule() {
    const item = risk.topRiskModule;

    if (!item) {
        return 'No modules found.';
    }

    return [
        `🚩 *${item.application} / ${item.module}*`,
        `• Failed: ${item.failed}`,
        `• Flaky: ${item.flaky}`,
        `• Failure Rate: ${item.failureRate.toFixed(2)}%`,
        `• Flaky Rate: ${item.flakyRate.toFixed(2)}%`,
        `• Risk Score: *${item.riskScore.toFixed(2)}%*`,
        `• Risk Level: ${item.riskLevel}`
    ].join('\n');
}

function formatSlowestModule() {
    const item = risk.slowestModule;

    if (!item) {
        return 'No execution duration data available.';
    }

    return [
        `🐢 *${item.application} / ${item.module}*`,
        `• Total Duration: *${formatDuration(item.durationMs)}*`,
        `• Average Duration: ${formatDuration(item.averageDurationMs)}`,
        `• Tests Measured: ${item.durationTestCount}`,
        `• Failed: ${item.failed}`,
        `• Flaky: ${item.flaky}`
    ].join('\n');
}

function formatReleaseReadiness() {
    const item = risk.releaseReadiness;

    if (!item) {
        return 'Release readiness data unavailable.';
    }

    const emoji = {
        'GO': '🟢',
        'CONDITIONAL GO': '🟡',
        'NO-GO': '🔴'
    }[item.status] || '⚪';

    const scores = item.componentScores;
    const metrics = item.metrics;
    const weights = item.thresholds.weights;

    return [
        `${emoji} *${item.status}*`,
        `*Reason:* ${item.reason}`,
        `*Readiness Score:* ${item.score}/100`,
        '',
        `• Test Pass Rate: ${metrics.passRate.toFixed(2)}% | ${weights.passRate}% | ${scores.passRate.toFixed(2)}`,
        `• Failure Rate: ${metrics.failureRate.toFixed(2)}% | ${weights.failureRate}% | ${scores.failureRate.toFixed(2)}`,
        `• Flaky Rate: ${metrics.flakyRate.toFixed(2)}% | ${weights.flakyRate}% | ${scores.flakyRate.toFixed(2)}`,
        `• Module Risk: ${metrics.highestModuleRisk.toFixed(2)}% | ${weights.moduleRisk}% | ${scores.moduleRisk.toFixed(2)}`,
        `• Performance: ${formatDuration(metrics.averageTestDurationMs)} | ${weights.performance}% | ${scores.performance.toFixed(2)}`
    ].join('\n');
}

function formatApplicationHealth() {
    return (analytics.applications || [])
        .map(item =>
            `• *${item.application}* — ` +
            `Total: ${item.total} | ` +
            `Passed: ${item.passed} | ` +
            `Failed: ${item.failed} | ` +
            `Flaky: ${item.flaky} | ` +
            `Skipped: ${item.skipped} | ` +
            `Pass Rate: ${item.passRate}% | ` +
            `Health: ${item.health}`
        )
        .join('\n');
}

function formatModuleBreakdown() {
    const grouped = {};

    for (const item of analytics.modules || []) {
        grouped[item.application] =
            grouped[item.application] || [];

        grouped[item.application].push(
            `   • *${item.module}* — ` +
            `Total: ${item.total} | ` +
            `Passed: ${item.passed} | ` +
            `Failed: ${item.failed} | ` +
            `Flaky: ${item.flaky}`
        );
    }

    return Object.entries(grouped)
        .map(([application, items]) =>
            `🧩 *${application}*\n${items.join('\n')}`
        )
        .join('\n\n');
}

function formatTagExecution() {
    const tags = (analytics.tags || [])
        .map(item =>
            `• *@${item.tag}* — ` +
            `Total: ${item.total} | ` +
            `Passed: ${item.passed} | ` +
            `Failed: ${item.failed} | ` +
            `Flaky: ${item.flaky} | ` +
            `Skipped: ${item.skipped} | ` +
            `Pass Rate: ${Number(item.passRate).toFixed(2)}% | ` +
            `Health: ${item.health}`
        );

    const untagged = analytics.untaggedTests || [];

    const untaggedText = untagged.length
        ? untagged.map((test, index) =>
            `${index + 1}. *${test.title}* — \`${test.file}\``
        ).join('\n')
        : 'All test cases have valid tags.';

    return [
        ...tags,
        '',
        `⚠️ *Test Cases Without Tags: ${untagged.length}*`,
        untaggedText
    ].join('\n');
}

// ---------- Build notification payload ----------

const notification = {
    ...notificationData,

    slack: {
        failedModules: formatFailedModules(),
        failedTests: formatTests(
            risk.failedTests || [],
            'failed'
        ),
        flakyTests: formatTests(
            risk.flakyTests || [],
            'flaky'
        ),
        topRiskModule: formatTopRiskModule(),
        slowestModule: formatSlowestModule(),
        releaseReadiness: formatReleaseReadiness(),
        applicationHealth: formatApplicationHealth(),
        moduleBreakdown: formatModuleBreakdown(),
        tagExecution: formatTagExecution()
    }
};

// ---------- Save notification data ----------

fs.writeFileSync(
    'notification-data.json',
    JSON.stringify(notification, null, 2),
    'utf8'
);

// ---------- GitHub Actions outputs ----------

// Preserve existing output names so your workflow can be
// migrated without changing every Slack expression at once.

setOutput(
    'RELEASE_READINESS_TEXT',
    notification.slack.releaseReadiness
);

setOutput(
    'TOP_RISK_MODULE_TEXT',
    notification.slack.topRiskModule
);

setOutput(
    'FAILED_MODULE_TEXT',
    notification.slack.failedModules
);

setOutput(
    'FAILED_TEST_TEXT',
    notification.slack.failedTests
);

setOutput(
    'FLAKY_TEST_TEXT',
    notification.slack.flakyTests
);

setOutput(
    'SLOWEST_MODULE_TEXT',
    notification.slack.slowestModule
);

setOutput(
    'APPLICATION_HEALTH_TEXT',
    notification.slack.applicationHealth
);

setOutput(
    'MODULE_BREAKDOWN_TEXT',
    notification.slack.moduleBreakdown
);

setOutput(
    'TAG_EXECUTION_TEXT',
    notification.slack.tagExecution
);

// Release readiness values.
const readiness = risk.releaseReadiness;

if (readiness) {
    setOutput(
        'RELEASE_READINESS_STATUS',
        readiness.status
    );

    setOutput(
        'RELEASE_READINESS_SCORE',
        String(readiness.score)
    );

    setOutput(
        'RELEASE_READINESS_REASON',
        readiness.reason
    );

    setOutput(
        'RELEASE_READINESS_JSON',
        JSON.stringify(readiness, null, 2)
    );
}

// Preserve title outputs.
setOutput(
    'ISSUE_TITLE',
    process.env.ISSUE_TITLE || 'N/A'
);

setOutput(
    'PR_TITLE',
    process.env.PR_TITLE || 'N/A'
);

console.log('notification-data.json generated.');
console.log('Notification data and GitHub Actions outputs generated.');
