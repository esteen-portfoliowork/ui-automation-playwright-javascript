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
            text: {
                type: 'plain_text',
                text: `${process.env.BUILD_EMOJI} Manual Validation`
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
  'manual-slack-payload.json',
  JSON.stringify(payload, null, 2)
);