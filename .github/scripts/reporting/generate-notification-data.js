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

// const analytics = readJson('analytics.json');
// const risk = readJson('risk-analysis.json');

// const historical = fs.existsSync('historical-trend.json')
//     ? readJson('historical-trend.json')
//     : null;


// ---------- Read generated data ----------
function readJsonResult(filePath, validator = () => true) {
    if (!fs.existsSync(filePath)) {
        return {
            available: false,
            data: null,
            reason: `File not found: ${filePath}`
        };
    }

    try {
        const data = JSON.parse(
            fs.readFileSync(filePath, 'utf8')
        );

        if (
            !data ||
            typeof data !== 'object' ||
            Array.isArray(data) ||
            !validator(data)
        ) {
            return {
                available: false,
                data: null,
                reason: `Invalid data structure: ${filePath}`
            };
        }

        return {
            available: true,
            data,
            reason: null
        };
    } catch (error) {
        return {
            available: false,
            data: null,
            reason: `Unable to parse ${filePath}: ${error.message}`
        };
    }
}

const analyticsResult = readJsonResult(
    'analytics.json',
    data =>
        Array.isArray(data.applications) &&
        Array.isArray(data.modules) &&
        Array.isArray(data.tags)
);

const riskResult = readJsonResult(
    'risk-analysis.json',
    data =>
        Array.isArray(data.failedModules) &&
        Array.isArray(data.failedTests) &&
        Array.isArray(data.flakyTests) &&
        Array.isArray(data.modules)
);

const historicalResult = readJsonResult(
    'historical-trend.json'
);

// Use empty structures only as safe fallbacks.
// Availability flags must always be checked before
// interpreting these fallback arrays as real results.

const analytics = analyticsResult.data || {
    execution: {},
    applications: [],
    modules: [],
    tags: [],
    untaggedTests: []
};

const risk = riskResult.data || {
    summary: {},
    failedModules: [],
    failedTests: [],
    flakyTests: [],
    modules: [],
    topRiskModules: [],
    topRiskModule: null,
    slowestModule: null,
    releaseReadiness: null
};

const historical = historicalResult.available
    ? historicalResult.data
    : null;

const playwrightResultsAvailable = fs.existsSync(
    'playwright-report/results.json'
);

const testResultsAvailable =
    playwrightResultsAvailable &&
    analyticsResult.available &&
    riskResult.available;

const reportingDataIssues = [
    ...(!playwrightResultsAvailable
        ? ['Playwright results file unavailable.']
        : []),

    ...(!analyticsResult.available
        ? [analyticsResult.reason]
        : []),

    ...(!riskResult.available
        ? [riskResult.reason]
        : [])
].filter(Boolean);
// ---------- ----------

// ---------- Notification data ----------
const notificationData = {
    generatedAt: new Date().toISOString(),

    // Execution Context
    context: {
        eventName: process.env.GITHUB_EVENT_NAME || 'Unknown',
        
        playwrightResultsAvailable,
        analyticsAvailable: analyticsResult.available,
        riskAnalysisAvailable: riskResult.available,
        testResultsAvailable,
        reportingDataIssues,
        
        repository: process.env.GITHUB_REPOSITORY || 'N/A',
        runNumber: process.env.GITHUB_RUN_NUMBER || 'N/A',
        runId: process.env.GITHUB_RUN_ID || 'N/A',
        runUrl: process.env.RUN_URL || 'N/A',

        buildStatus: process.env.BUILD_STATUS || 'UNKNOWN',
        buildEmoji: process.env.BUILD_EMOJI || '⚪',
        buildText: process.env.BUILD_TEXT || 'Build status unavailable.',
        executionHealth: process.env.EXECUTION_HEALTH || 'Unknown',

        browser: process.env.BROWSER || 'N/A',
        executedTag: process.env.EXECUTED_TAG || 'N/A',
        environment: process.env.ENVIRONMENT || 'N/A',

        playwrightVersion: process.env.PLAYWRIGHT_VERSION || 'N/A',
        nodeVersion: process.env.NODE_VERSION || 'N/A',
        runnerOS: process.env.RUNNER_OS_NAME || 'N/A',

        startDate: process.env.START_DATE || 'N/A',
        endDate: process.env.END_DATE || 'N/A',
        executionDuration: process.env.EXECUTION_DURATION || 'N/A'
    },

    // Execution Metrics
    metrics: {
        totalTests: Number(process.env.TOTAL_TESTS || 0),
        passedTests: Number(process.env.PASSED_TESTS || 0),
        failedTests: Number(process.env.FAILED_TESTS || 0),
        flakyTests: Number(process.env.FLAKY_TESTS || 0),
        skippedTests: Number(process.env.SKIPPED_TESTS || 0),

        passRate: Number(process.env.PASS_RATE || 0),
        failureRate: Number(process.env.FAILURE_RATE || 0),
        flakyRate: Number(process.env.FLAKY_RATE || 0),
        skippedRate: Number(process.env.SKIPPED_RATE || 0),

        qualityScore: Number(process.env.QUALITY_SCORE || 0)
    },

    // Analytics
    execution: analytics.execution,

    applications: analytics.applications,
    modules: analytics.modules,
    tags: analytics.tags,
    untaggedTests: analytics.untaggedTests,

    // Risk Analysis
    risk: {
        summary: risk.summary,

        failedModules: risk.failedModules,
        failedTests: risk.failedTests,
        flakyTests: risk.flakyTests,

        modules: risk.modules,

        topRiskModules: risk.topRiskModules,
        topRiskModule: risk.topRiskModule,

        slowestModule: risk.slowestModule,

        releaseReadiness: risk.releaseReadiness
    },

    // Historical Trend
    historicalTrend: historical,

    // Pull Request Context
    pr: {
        number: process.env.PR_NUMBER || 'N/A',
        title: process.env.PR_TITLE || 'N/A',
        url: process.env.PR_URL || 'N/A',
        author: process.env.PR_AUTHOR || 'N/A',
        branch: process.env.PR_BRANCH || 'N/A',
        baseBranch: process.env.PR_BASE_BRANCH || 'N/A',
        labels: process.env.PR_LABELS || 'N/A',
        sha: process.env.PR_SHA || 'N/A'
    },

    // Report Links
    links: {
        runUrl: process.env.RUN_URL || 'N/A',
        playwrightReport: process.env.PLAYWRIGHT_REPORT_URL || '',
        testResults: process.env.TEST_RESULTS_URL || '',
        jsonResults: process.env.JSON_RESULTS_URL || '',
        allureResults: process.env.ALLURE_RESULTS_URL || '',
        allureReport: process.env.ALLURE_REPORT_URL || '',
        markdownReports: process.env.MARKDOWN_REPORT_URL || ''
    },

    // Notification Configuration
    notification: {
        slackChannel: process.env.SLACK_CHANNEL || ''
    }
};
// ---------- ----------

// ---------- Formatting helpers ----------
function formatDuration(ms) {
    if (!Number.isFinite(ms)) {
        return 'N/A';
    }

    return `${(ms / 1000).toFixed(2)}s`;
}

function formatFailedModules() {
    if (!riskResult.available) {
        return '⚪ Failed module data unavailable.';
    }

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
    if (!riskResult.available) {
        return `⚪ ${type} test data unavailable.`;
    }
    
    if (!tests.length) {
        return type === 'flaky'
            ? '✅ No flaky tests found.'
            : '✅ No failed tests found.';
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
    if (!riskResult.available) {
        return '⚪ Risk analysis data unavailable.';
    }

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
        `• Module Risk Score: *${item.riskScore.toFixed(2)}%*`,
        `• Module Health Score: *${item.healthScore === null ? 'N/A' : `${item.healthScore.toFixed(2)}%`}*`,
        `• Risk Level: ${item.riskLevel}`,
        `• Health Status: ${item.healthStatus || '⚪ Unknown'}`
    ].join('\n');
}

function formatSlowestModule() {
    if (!riskResult.available) {
        return '⚪ Risk analysis data unavailable.';
    }

    const item = risk.slowestModule;

    const module = (risk.modules || []).find(
        entry =>
            entry.application === item.application &&
            entry.module === item.module
    );

    if (!item) {
        return 'No execution duration data available.';
    }

    return [
        `🐢 *${item.application} / ${item.module}*`,
        `• Total Duration: *${formatDuration(item.durationMs)}*`,
        `• Average Duration: ${formatDuration(item.averageDurationMs)}`,
        `• Tests Measured: ${item.durationTestCount}`,
        `• Failed: ${item.failed}`,
        `• Flaky: ${item.flaky}`,
        `• Module Risk Score: ${module ? `${module.riskScore.toFixed(2)}%` : 'N/A'}`,
        `• Module Health Score: ${module?.healthScore !== null && module?.healthScore !== undefined ? `${module.healthScore.toFixed(2)}%` : 'N/A'} | ${module?.healthStatus || '⚪ Unknown'}`
    ].join('\n');
}

function formatReleaseReadiness() {
    if (!riskResult.available) {
        return '⚪ Release readiness data unavailable.';
    }

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
    if (!analyticsResult.available || !riskResult.available) {
        return '⚪ Application health data unavailable.';
    }

    const applicationRiskMap = new Map();

    for (const module of risk.modules || []) {
        const existing = applicationRiskMap.get(module.application);

        if (!existing || module.riskScore > existing.riskScore) {
            applicationRiskMap.set(module.application, module);
        }
    }

    return (analytics.applications || [])
        .map(item => {
            const module = applicationRiskMap.get(item.application);

            const riskScore = module
                ? `${module.riskScore.toFixed(2)}%`
                : 'N/A';

            const healthScore =
                module?.healthScore !== null &&
                module?.healthScore !== undefined
                    ? `${module.healthScore.toFixed(2)}%`
                    : 'N/A';

            return [
                `• *${item.application}*`,
                `Total: ${item.total} | Passed: ${item.passed} | Failed: ${item.failed}`,
                `Module Risk Score: ${riskScore}`,
                `Module Health Score: ${healthScore}`,
                `Health Status: ${module?.healthStatus || '⚪ Unknown'}`
            ].join(' | ');
        })
        .join('\n');
}

function formatModuleBreakdown() {
    if (!analyticsResult.available || !riskResult.available) {
        return '⚪ Module breakdown data unavailable.';
    }

    const riskModuleMap = new Map(
        (risk.modules || []).map(module => [
            `${module.application}::${module.module}`,
            module
        ])
    );

    const grouped = {};

    for (const item of analytics.modules || []) {
        grouped[item.application] =
            grouped[item.application] || [];

        const module = riskModuleMap.get(
            `${item.application}::${item.module}`
        );

        const riskScore = module
            ? `${module.riskScore.toFixed(2)}%`
            : 'N/A';

        const healthScore =
            module?.healthScore !== null &&
            module?.healthScore !== undefined
                ? `${module.healthScore.toFixed(2)}%`
                : 'N/A';

        const healthStatus =
            module?.healthStatus || '⚪ Unknown';

        grouped[item.application].push(
            `• *${item.module}* — ` +
            `Failed: ${item.failed} | Flaky: ${item.flaky} | ` +
            `Module Risk Score: ${riskScore} | ` +
            `Module Health Score: ${healthScore} | ` +
            `Health Status: ${healthStatus}`
        );
    }

    return Object.entries(grouped)
        .map(([application, items]) =>
            `🧩 *${application}*\n${items.join('\n')}`
        )
        .join('\n\n');
}


function formatTagExecution() {
    if (!analyticsResult.available) {
        return '⚪ Tag execution data unavailable.';
    }

    const tags = (analytics.tags || [])
        .map(item => {

            const riskScore =
                Number.isFinite(item.riskScore)
                    ? `${item.riskScore.toFixed(2)}%`
                    : 'N/A';

            const healthScore =
                item.healthScore !== null &&
                Number.isFinite(item.healthScore)
                    ? `${item.healthScore.toFixed(2)}%`
                    : 'N/A';

            const healthStatus =
                item.healthStatus || '⚪ Unknown';

            return [
                `• *@${item.tag}*`,
                `Total: ${item.total}`,
                `Executed: ${item.executed}`,
                `Passed: ${item.passed}`,
                `Failed: ${item.failed}`,
                `Flaky: ${item.flaky}`,
                `Skipped: ${item.skipped}`,
                `Pass Rate: ${Number(item.passRate).toFixed(2)}%`,
                `Tag Risk Score: ${riskScore}`,
                `Tag Health Score: ${healthScore}`,
                `Health Status: ${healthStatus}`
            ].join(' | ');
        });

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
