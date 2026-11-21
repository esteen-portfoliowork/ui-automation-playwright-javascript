const fs = require('fs');

function buildTableRows(data) {
    return data.map(([label, value]) => [
        {
        type: 'raw_text',
        text: label
        },
        {
        type: 'raw_text',
        text: value || 'N/A'
        }
    ]);
}

function buildTableRows3(data) {
    return data.map(([col1, col2, col3]) => [
        {
        type: 'raw_text',
        text: col1 || 'N/A'
        },
        {
        type: 'raw_text',
        text: col2 || 'N/A'
        },
        {
        type: 'raw_text',
        text: col3 || 'N/A'
        }
    ]);
}

function markdownSection(title, content, notAvailable) {
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: title
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: content || notAvailable
            }
        }
    ];
}

const executionOverviewRows = buildTableRows([
    ['🌐 Browser', process.env.BROWSER],
    ['🏷️ Executed Tag', process.env.EXECUTED_TAG],
    ['🌍 Environment', process.env.ENVIRONMENT],
    ['🎭 Playwright Version', process.env.PLAYWRIGHT_VERSION],
    ['📦 Node Version', process.env.NODE_VERSION],
    ['💻 Runner OS', process.env.RUNNER_OS_NAME],
    ['▶️ Start Time', process.env.START_DATE],
    ['⏹️ End Time', process.env.END_DATE]
]);

const prDetailsRows = buildTableRows([
    ['🔢 PR Number', `#${process.env.PR_NUMBER}`],
    ['📝 PR Title', process.env.PR_TITLE],
    ['🔗 PR URL', process.env.PR_URL],
    ['👤 Author', process.env.PR_AUTHOR],
    ['🌿 Source Branch', process.env.PR_BRANCH],
    ['🎯 Target Branch', process.env.PR_BASE_BRANCH],
    ['🏷️ Labels', process.env.PR_LABELS],
    ['🔖 Commit SHA', process.env.PR_SHA]
]);

const executionMetrics = buildTableRows3([
    ['🧪 Total Tests', process.env.TOTAL_TESTS, '-'],
    ['✅ Passed', process.env.PASSED_TESTS, `${process.env.PASS_RATE}%`],
    ['❌ Failed', process.env.FAILED_TESTS, `${process.env.FAILURE_RATE}%`],
    ['⚠️ Flaky', process.env.FLAKY_TESTS, `${process.env.FLAKY_RATE}%`],
    ['⏭️ Skipped', process.env.SKIPPED_TESTS, `${process.env.SKIPPED_RATE}%`],
    ['🏆 Quality Score', '-', `${process.env.QUALITY_SCORE}%`],
    ['⏱️ Duration', process.env.EXECUTION_DURATION, '-']
]);

// const releaseReadiness =
//   readFile('release-readiness.md');

// const applicationHealth =
//   readFile('application-health-dashboard.md');

// const moduleBreakdown =
//   readFile('module-breakdown.md');

// const tagAnalytics =
//   readFile('tag-execution-summary.md');

// const topRisk =
//   readFile('top-risk-modules.md');

// const failedModules =
//   readFile('failed-modules.md');

// const failedTests =
//   readFile('failed-tests.md');

// const flakyTests =
//   readFile('flaky-tests.md');

// const slowestModule =
//   readFile('slowest-module.md');

// const historicalTrend =
//   readFile('historical-test-trend.md');

// const reportLinks =
//   readFile('report-links.md');

const comment = `
<!-- playwright-validation-report -->

# 🎭 PLAYWRIGHT EXECUTION SUMMARY

## ${process.env.BUILD_EMOJI} Pull Request Validation

${process.env.BUILD_TEXT}

## ❤️ Execution Health

${process.env.EXECUTION_HEALTH}

Executed ${process.env.TOTAL_TESTS} automated tests with a pass rate of ${process.env.PASS_RATE}% in ${process.env.EXECUTION_DURATION}.

## 📋 Execution Overview

| Item | Value |
|:------:|:-------:|
| 🌐 Browser | ${process.env.BROWSER} |
| 🏷️ Executed Tag | ${process.env.EXECUTED_TAG} |
| 🌍 Environment | ${process.env.ENVIRONMENT} |
| 🎭 Playwright Version | ${process.env.PLAYWRIGHT_VERSION} |
| 📦 Node Version | ${process.env.NODE_VERSION} |
| 💻 Runner OS | ${process.env.RUNNER_OS_NAME} |
| ▶️ Start Time | ${process.env.START_DATE} |
| ⏹️ End Time | ${process.env.END_DATE} |
`;

fs.writeFileSync(
  'pr-comment.md',
  fullComment
);
