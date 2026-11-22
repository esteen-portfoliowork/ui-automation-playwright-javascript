
const fs = require('fs');

const data = JSON.parse(
    fs.readFileSync('notification-data.json', 'utf8')
);

const context = data.context;
const metrics = data.metrics;
const pr = data.pr;

function readReport(file) {
    return fs.existsSync(file)
        ? fs.readFileSync(file, 'utf8').trim()
        : `_Report unavailable: ${file}_`;
}

const sections = [
    '<!-- playwright-validation-report -->',
    '# 🎭 Playwright Execution Summary',
    '',
    `## ${context.buildEmoji} Pull Request Validation`,
    '',
    context.buildText,
    '',
    '## ❤️ Execution Health',
    '',
    context.executionHealth,
    '',
    `Executed **${metrics.total}** automated tests with a pass rate of **${metrics.passRate}%** in **${context.executionDuration}**.`,
    '',
    '## 📋 Pull Request Details',
    '',
    `| Item | Value |`,
    `|---|---|`,
    `| PR Number | #${pr.number || 'N/A'} |`,
    `| PR Title | ${pr.title || 'N/A'} |`,
    `| Author | ${pr.author || 'N/A'} |`,
    `| Source Branch | ${pr.branch || 'N/A'} |`,
    `| Target Branch | ${pr.baseBranch || 'N/A'} |`,
    `| Labels | ${pr.labels || 'N/A'} |`,
    '',
    '## 📊 Execution Metrics',
    '',
    '| Metric | Count | Rate |',
    '|---|---:|---:|',
    `| Total Tests | ${metrics.total} | - |`,
    `| Passed | ${metrics.passed} | ${metrics.passRate}% |`,
    `| Failed | ${metrics.failed} | ${metrics.failureRate}% |`,
    `| Flaky | ${metrics.flaky} | ${metrics.flakyRate}% |`,
    `| Skipped | ${metrics.skipped} | ${metrics.skippedRate}% |`,
    `| Quality Score | - | ${metrics.qualityScore}% |`,
    '',
    '## 🛡️ Release Readiness',
    '',
    readReport('release-readiness.md'),
    '',
    '## 🖥️ Application Health',
    '',
    readReport('application-health-dashboard.md'),
    '',
    '## 📦 Module Breakdown',
    '',
    readReport('module-breakdown.md'),
    '',
    '## 🏷️ Test Tag Analytics',
    '',
    readReport('tag-execution-summary.md'),
    '',
    '## 🏆 Top Risk Modules',
    '',
    readReport('top-risk-modules.md'),
    '',
    '## ❌ Failed Modules',
    '',
    readReport('failed-modules.md'),
    '',
    '## ❌ Failed Tests',
    '',
    readReport('failed-tests.md'),
    '',
    '## ⚠️ Flaky Tests',
    '',
    readReport('flaky-tests.md'),
    '',
    '## ⏱️ Slowest Module',
    '',
    readReport('slowest-module.md'),
    '',
    '## 📈 Historical Test Trend',
    '',
    readReport('historical-test-trend.md'),
    '',
    '## 🔗 Report Links',
    '',
    readReport('report-links.md')
];

fs.writeFileSync(
    'pr-comment.md',
    sections.join('\n'),
    'utf8'
);

console.log('PR comment generated successfully.');