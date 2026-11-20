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
                text: 'Executed ${{ env.TOTAL_TESTS }} automated tests with a pass rate of ${{ env.PASS_RATE }}% in ${{ env.EXECUTION_DURATION }}.'
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
            rows: [
                [
                { type: 'raw_text', text: 'Item' },
                { type: 'raw_text', text: 'Value' }
                ],
                ...executionOverviewRows
            ]
        }
    ]
};

fs.writeFileSync(
  'pr-slack.json',
  JSON.stringify(payload, null, 2)
);