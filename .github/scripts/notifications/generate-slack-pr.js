const fs = require('fs');

const data =
  JSON.parse(
    fs.readFileSync(
      'notification-data.json',
      'utf8'
    )
  );

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
    ['🌐 Browser', data.BROWSER],
    ['🏷️ Executed Tag', data.EXECUTED_TAG],
    ['🌍 Environment', data.ENVIRONMENT],
    ['🎭 Playwright Version', data.PLAYWRIGHT_VERSION],
    ['📦 Node Version', data.NODE_VERSION],
    ['💻 Runner OS', data.RUNNER_OS_NAME],
    ['▶️ Start Time', data.START_DATE],
    ['⏹️ End Time', data.END_DATE]
]);

const prDetailsRows = buildTableRows([
    ['🔢 PR Number', `#${data.PR_NUMBER}`],
    ['📝 PR Title', data.PR_TITLE],
    ['🔗 PR URL', data.PR_URL],
    ['👤 Author', data.PR_AUTHOR],
    ['🌿 Source Branch', data.PR_BRANCH],
    ['🎯 Target Branch', data.PR_BASE_BRANCH],
    ['🏷️ Labels', data.PR_LABELS],
    ['🔖 Commit SHA', data.PR_SHA]
]);

const executionMetrics = buildTableRows3([
    ['🧪 Total Tests', data.TOTAL_TESTS, '-'],
    ['✅ Passed', data.PASSED_TESTS, `${data.PASS_RATE}%`],
    ['❌ Failed', data.FAILED_TESTS, `${data.FAILURE_RATE}%`],
    ['⚠️ Flaky', data.FLAKY_TESTS, `${data.FLAKY_RATE}%`],
    ['⏭️ Skipped', data.SKIPPED_TESTS, `${data.SKIPPED_RATE}%`],
    ['🏆 Quality Score', '-', `${data.QUALITY_SCORE}%`],
    ['⏱️ Duration', data.EXECUTION_DURATION, '-']
]);

const payload = {
    channel: data.SLACK_CHANNEL,
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
                text: `${data.buildEmoji} Pull Request Validation`
            }
        },
        {
            type: 'section',
            text: {
                type: 'plain_text',
                text: data.BUILD_TEXT
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
                text: data.EXECUTION_HEALTH
            }
        },
        {
            type: 'section',
            text: {
                type: 'plain_text',
                text: `Executed ${data.TOTAL_TESTS} automated tests with a pass rate of ${data.PASS_RATE}% in ${data.EXECUTION_DURATION}.`
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
        ...markdownSection(
            '🛡️ Release Readiness',
            data.RELEASE_READINESS_TEXT,
            'No release readiness data available.'
        ),
        ...markdownSection(
            '🖥️ Application Health',
            data.applicationHealth,
            'No application health data available.'
        ),
        ...markdownSection(
            '📦 Module Breakdown',
            data.MODULE_BREAKDOWN_TEXT,
            'No module available.'
        ),
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `🏷️ Test Tag Analytics`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: data.tagExecution || 'No tag available.'
            }
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `🏆 Top Risk Module`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: data.TOP_RISK_MODULE_TEXT || 'No risk modules available.'
            }
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `❌ Failed Modules`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: data.FAILED_MODULE_TEXT || 'No failed modules available.'
            }
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `❌ Failed Tests`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: data.FAILED_TEST_TEXT || 'No failed tests available.'
            }
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `⚠️ Flaky Tests`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: data.FLAKY_TEST_TEXT || 'No flaky tests available.'
            }
        },
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: `⏱️ Slowest Module`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: data.SLOWEST_MODULE_TEXT || 'No slowest module available.'
            }
        },
    ]
};

fs.writeFileSync(
  'pr-slack.json',
  JSON.stringify(payload, null, 2)
);