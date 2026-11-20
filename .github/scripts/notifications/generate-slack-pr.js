const fs = require('fs');

const executionOverviewRows = [
  ['🌐 Browser', process.env.BROWSER],
  ['🏷️ Executed Tag', process.env.EXECUTED_TAG],
  ['🌍 Environment', process.env.ENVIRONMENT],
  ['🎭 Playwright Version', process.env.PLAYWRIGHT_VERSION],
  ['📦 Node Version', process.env.NODE_VERSION],
  ['💻 Runner OS', process.env.RUNNER_OS_NAME],
  ['▶️ Start Time', process.env.START_DATE],
  ['⏹️ End Time', process.env.END_DATE]
].map(([label, value]) => [
  {
    type: 'raw_text',
    text: label
  },
  {
    type: 'raw_text',
    text: value || 'N/A'
  }
]);

const pullRequestDetails = [
    ['🔢 PR Number', process.env.PR_NUMBER],
    ['📝 PR Title', process.env.PR_TITLE],
    ['🔗 PR URL', process.env.PR_URL],
    ['👤 Author', process.env.PR_AUTHOR],
]

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
                text: `🚦 Execution Health`
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

    ]
};

fs.writeFileSync(
  'pr-slack.json',
  JSON.stringify(payload, null, 2)
);