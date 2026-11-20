const fs = require('fs');

const payload = {
    channel: process.env.SLACK_CHANNEL,
    text: 'Playwright Execution Summary',
    blocks: [
        {
            type: 'header',
            level: 1,
            text: {
                type: 'plain_text',
                text: '🎭 Playwright Execution Summary'
            }
        },
        {
            type: 'divider'
        },
        {
            type: 'header',
            level: 2,
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
        }
    ]
};

fs.writeFileSync(
  'pr-slack.json',
  JSON.stringify(payload, null, 2)
);