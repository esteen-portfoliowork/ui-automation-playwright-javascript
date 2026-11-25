
const fs = require('fs');

const data = JSON.parse(
    fs.readFileSync('notification-data.json', 'utf8')
);

const context = data.context || {};
const metrics = data.metrics || {};
const pr = data.pr || {};
const risk = data.risk || {};

if (!data.context || !data.metrics) {
    throw new Error(
        'Invalid notification-data.json: context or metrics is missing.'
    );
}

const eventName = context.eventName;

const eventTitle = {
    pull_request: 'Pull Request Validation',
    workflow_dispatch: 'Manual Validation',
    push: 'Push Validation'
}[eventName] || 'Playwright Validation';

// ---------- Helpers ----------

function readReport(file) {
    if (!fs.existsSync(file)) {
        return `⚪ Report data unavailable: ${file}`;
    }

    const content = fs.readFileSync(
        file,
        'utf8'
    ).trim();

    if (!content) {
        return `⚪ Report data unavailable: ${file} is empty.`;
    }

    return content;
}

function heading(text) {
    return `## ${text}\n`;
}

function tableRow(label, value) {
    return `| ${label} | ${value ?? 'N/A'} |`;
}
// ---------- ----------

// ---------- Overall Test Result ----------
function getOverallTestResult() {
    if (context.testResultsAvailable !== true) {
        return {
            emoji: '⚪',
            message:
                'Test-result data unavailable; overall result cannot be determined.'
        };
    }

    const total = Number(metrics.totalTests ?? 0);
    const failed = Number(metrics.failedTests ?? 0);
    const flaky = Number(metrics.flakyTests ?? 0);

    if (total === 0) {
        return {
            emoji: '⚪',
            message: 'No test cases were analyzed.'
        };
    }

    if (failed === 0 && flaky === 0) {
        return {
            emoji: '🟢',
            message: 'All tests passed without flaky results.'
        };
    }

    if (failed === 0 && flaky > 0) {
        return {
            emoji: '🟡',
            message: 'Tests passed with flaky results detected.'
        };
    }

    return {
        emoji: '🔴',
        message: 'Test failures detected; investigation required.'
    };
}

// ---------- ----------

// ---------- Execution Summary ----------
const overallResult = getOverallTestResult();

const lines = [
    '# 🎭 Playwright Execution Summary',
    '',
    `## ${context.buildEmoji || '🎭'} ${eventTitle}`,
    '',
    context.buildText || 'Validation status unavailable.',
    '',

    '## 🧪 Overall Test Result',
    '',
    `### ${overallResult.emoji} ${overallResult.message}`,
    '',

    '## ❤️ Execution Health',
    '',
    context.executionHealth || 'Unknown',
    '',
    `Executed **${metrics.totalTests ?? 0}** automated tests with a pass rate of **${metrics.passRate ?? 0}%** in **${context.executionDuration || 'N/A'}**.`,
    '',
    heading('📋 Execution Overview'),
    '',
    '| Item | Value |',
    '|---|---|',
    tableRow('Browser', context.browser),
    tableRow('Executed Tag', context.executedTag),
    tableRow('Environment', context.environment),
    tableRow('Playwright Version', context.playwrightVersion),
    tableRow('Node Version', context.nodeVersion),
    tableRow('Runner OS', context.runnerOS),
    tableRow('Start Time', context.startDate),
    tableRow('End Time', context.endDate),
    '',
];

// ---------- PR Details ----------

if (eventName === 'pull_request') {
    lines.push(
        heading('📋 Pull Request Details'),
        '',
        '| Item | Value |',
        '|---|---|',
        tableRow('PR Number', `#${pr.number}`),
        tableRow('PR Title', pr.title),
        tableRow('Author', pr.author),
        tableRow('Source Branch', pr.branch),
        tableRow('Target Branch', pr.baseBranch),
        tableRow('Labels', pr.labels),
        tableRow('Commit SHA', pr.sha),
        ''
    );
}

// ---------- Execution Metrics ----------

lines.push(
    heading('📊 Execution Metrics'),
    '',
    '| Metric | Count | Rate |',
    '|---|---:|---:|',
    `| Total Tests | ${metrics.totalTests ?? 0} | - |`,
    `| Passed | ${metrics.passedTests ?? 0} | ${metrics.passRate ?? 0}% |`,
    `| Failed | ${metrics.failedTests ?? 0} | ${metrics.failureRate ?? 0}% |`,
    `| Flaky | ${metrics.flakyTests ?? 0} | ${metrics.flakyRate ?? 0}% |`,
    `| Skipped | ${metrics.skippedTests ?? 0} | ${metrics.skippedRate ?? 0}% |`,
    `| Quality Score | - | ${metrics.qualityScore ?? 0}% |`,
    ''
);

// ---------- Report Sections ----------

const reports = [
    ['🏆 Release Quality Score', 'release-readiness.md'],
    ['🚦 Quality Gate Evaluation', 'quality-gates.md'],
    ['📊 Quality Scoring Dashboard', 'quality-scoring-dashboard.md'],
    ['🤖 Automated Release Recommendation', 'release-recommendations.md'],
    ['🖥️ Application Health', 'application-health-dashboard.md'],
    ['📦 Module Breakdown', 'module-breakdown.md'],
    ['🏷️ Test Tag Analytics', 'tag-execution-summary.md'],
    ['🚨 Top Risk Modules', 'top-risk-modules.md'],
    ['❌ Failed Modules', 'failed-modules.md'],
    ['❌ Failed Tests', 'failed-tests.md'],
    ['⚠️ Flaky Tests', 'flaky-tests.md'],
    ['⏱️ Slowest Module', 'slowest-module.md'],
    ['📈 Historical Test Trend', 'historical-test-trend.md'],
    ['🔗 Report Links', 'report-links.md']
];

for (const [title, file] of reports) {
    lines.push(
        heading(title),
        '',
        readReport(file),
        ''
    );
}

// ---------- Generate Master Execution Report ----------
const output = lines.join('\n') + '\n';

const reportPath = 'execution-summary.md';

// Save the complete report.
fs.writeFileSync(
    reportPath,
    output,
    'utf8'
);

console.log(
    `Master execution report generated: ${reportPath}`
);

// ---------- Publish to GitHub Workflow Summary ----------
if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        output,
        'utf8'
    );

    console.log(
        'GitHub Workflow Summary published successfully.'
    );
} else {
    console.log(
        'GITHUB_STEP_SUMMARY unavailable. Master report was saved locally.'
    );
}