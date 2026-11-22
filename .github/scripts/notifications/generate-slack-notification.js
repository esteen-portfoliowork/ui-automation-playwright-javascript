const fs = require('fs');

const REPORT_FILE = 'execution-summary.md';

const data = JSON.parse(
    fs.readFileSync('notification-data.json', 'utf8')
);

const context = data.context || {};
const metrics = data.metrics || {};

const eventName = context.eventName;

const eventTitle = {
    pull_request: 'Pull Request Validation',
    workflow_dispatch: 'Manual Validation'
}[eventName];

const channel = data.notification?.slackChannel;

// ---------- Validate Inputs ----------

if (!eventTitle) {
    throw new Error(
        `Unsupported Slack event: ${eventName}`
    );
}

if (!channel) {
    throw new Error(
        'Slack channel is missing.'
    );
}

if (!fs.existsSync(REPORT_FILE)) {
    throw new Error(
        `Master execution report not found: ${REPORT_FILE}`
    );
}

const report = fs.readFileSync(
    REPORT_FILE,
    'utf8'
).trim();

if (!report) {
    throw new Error(
        'Master execution report is empty.'
    );
}

// ---------- Convert GitHub Markdown to Slack ----------

function convertMarkdown(markdown) {
    const lines = markdown.split('\n');
    const result = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Remove Markdown table separator rows.
        if (/^\|?[\s:|-]+\|?$/.test(trimmed)) {
            continue;
        }

        // Convert Markdown table rows into readable text.
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const cells = trimmed
                .split('|')
                .slice(1, -1)
                .map(cell => cell.trim());

            if (cells.length >= 2) {
                const [label, ...values] = cells;

                result.push(
                    `• *${label}:* ${values.join(' | ')}`
                );
            }

            continue;
        }

        // Convert Markdown headings into Slack headings.
        const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);

        if (headingMatch) {
            result.push(`*${headingMatch[1]}*`);
            continue;
        }

        // Convert GitHub Markdown links into Slack links.
        const converted = trimmed.replace(
            /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
            '<$2|$1>'
        );

        result.push(converted);
    }

    return result.join('\n').trim();
}

// ---------- Split Report into Slack-Compatible Chunks ----------

function splitText(text, maxLength = 2800) {
    const paragraphs = text.split(/\n{2,}/);
    const chunks = [];

    let current = '';

    for (const paragraph of paragraphs) {
        if (paragraph.length > maxLength) {
            if (current) {
                chunks.push(current);
                current = '';
            }

            // Split unusually long paragraphs safely.
            for (let i = 0; i < paragraph.length; i += maxLength) {
                chunks.push(
                    paragraph.slice(i, i + maxLength)
                );
            }

            continue;
        }

        const candidate = current
            ? `${current}\n\n${paragraph}`
            : paragraph;

        if (candidate.length > maxLength) {
            if (current) {
                chunks.push(current);
            }

            current = paragraph;
        } else {
            current = candidate;
        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

// ---------- Slack Block Helpers ----------

function header(text) {
    return {
        type: 'header',
        text: {
            type: 'plain_text',
            text: text.slice(0, 150),
            emoji: true
        }
    };
}

function section(text) {
    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text
        }
    };
}

function divider() {
    return {
        type: 'divider'
    };
}

// ---------- Build Slack Message ----------

const slackText = convertMarkdown(report);
const chunks = splitText(slackText);

const blocks = [
    header('🎭 PLAYWRIGHT EXECUTION SUMMARY'),

    section(
        `*${eventTitle}*\n${context.buildText || 'Validation completed.'}`
    ),

    section(
        `*Validation Status:* ${context.buildStatus || 'UNKNOWN'}\n` +
        `*Execution Health:* ${context.executionHealth || 'Unknown'}\n` +
        `*Total Tests:* ${metrics.totalTests ?? 0}\n` +
        `*Pass Rate:* ${metrics.passRate ?? 0}%`
    ),

    divider(),

    ...chunks.map(chunk => section(chunk))
];

// ---------- Validate Slack Limits ----------

if (blocks.length > 50) {
    throw new Error(
        `Slack block limit exceeded: ${blocks.length}. ` +
        'The report must be split across multiple Slack messages.'
    );
}

if (slackText.length > 40000) {
    throw new Error(
        'Slack report exceeds the message text limit. ' +
        'Use multiple Slack messages.'
    );
}

// ---------- Create Payload ----------

const payload = {
    channel,
    text: `Playwright ${eventTitle} — ${metrics.failedTests ?? 0} failed test(s)`,
    blocks
};

// ---------- Select Output Filename ----------

const outputFile = eventName === 'pull_request'
    ? 'pr-slack.json'
    : 'manual-slack.json';

// ---------- Write Payload ----------

fs.writeFileSync(
    outputFile,
    JSON.stringify(payload, null, 2),
    'utf8'
);

console.log(
    `Slack notification generated: ${outputFile}`
);

console.log(
    `Report sections sourced from: ${REPORT_FILE}`
);

console.log(
    `Slack blocks: ${blocks.length}`
);

console.log(
    `Report characters: ${slackText.length}`
);