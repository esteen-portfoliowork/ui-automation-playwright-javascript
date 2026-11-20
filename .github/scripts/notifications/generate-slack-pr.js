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

const payload = {
    channel: process.env.SLACK_CHANNEL,
    text: 'Playwright Execution Summary',
    blocks: [
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: '🎭 PLAYWRIGHT EXECUTION SUMMARY'
            }
        },
        {
            type: 'divider'
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `${process.env.BUILD_EMOJI} Pull Request Validation`
            }
        },
        {
            type: 'section',
            text: {
                type: 'plain_text',
                text: process.env.BUILD_TEXT
            }
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `❤️ Execution Health`
            }
        },
        {
            type: 'section',
            text: {
                type: 'plain_text',
                text: process.env.EXECUTION_HEALTH
            }
        },
        {
            type: 'section',
            text: {
                type: 'plain_text',
                text: `Executed ${process.env.TOTAL_TESTS} automated tests with a pass rate of ${process.env.PASS_RATE}% in ${process.env.EXECUTION_DURATION}.`
            }
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `📋 Execution Overview`
            }
        },
        {
            type: 'table',
            column_settings: [
                {
                align: 'center'
                },
                {
                align: 'center'
                }
            ],
            rows: [
                [
                {
                    type: 'raw_text',
                    text: 'Item'
                },
                {
                    type: 'raw_text',
                    text: 'Value'
                }
                ],
                ...executionOverviewRows
            ]
        },
        {
            type: 'header',
            level: 3,
            text: {
                type: 'plain_text',
                text: `📋 Pull Request Details`
            }
        },
        {
            type: 'table',
            column_settings: [
                {
                align: 'center'
                },
                {
                align: 'center'
                }
            ],
            rows: [
                [
                {
                    type: 'raw_text',
                    text: 'Item'
                },
                {
                    type: 'raw_text',
                    text: 'Value'
                }
                ],
                ...prDetailsRows
            ]
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `📊 Execution Metrics`
            }
        },
        {
            type: 'table',
            column_settings: [
                {
                align: 'center'
                },
                {
                align: 'center'
                },
                {
                align: 'center'
                }
            ],
            rows: [
                [
                {
                    type: 'raw_text',
                    text: 'Item'
                },
                {
                    type: 'raw_text',
                    text: 'Value'
                },
                {
                    type: 'raw_text',
                    text: 'Value'
                }
                ],
                ...executionMetrics
            ]
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `🛡️ Release Readiness`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: process.env.RELEASE_READINESS_TEXT || 'No release readiness data available.'
            }
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `🖥️ Application Health Dashboard`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: process.env.APPLICATION_HEALTH_TEXT || 'No application health available.'
            }
        },
    ]
};

fs.writeFileSync(
  'pr-slack.json',
  JSON.stringify(payload, null, 2)
);