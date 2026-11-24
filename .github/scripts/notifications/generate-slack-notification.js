const fs = require('fs');

const REPORT_FILE = 'execution-summary.md';
const DATA_FILE = 'notification-data.json';

const data = JSON.parse(
    fs.readFileSync(DATA_FILE, 'utf8')
);

const context = data.context || {};
const metrics = data.metrics || {};

const eventName =
    data.context?.eventName ||
    data.eventName ||
    process.env.GITHUB_EVENT_NAME;

const eventTitle = {
    pull_request: 'Pull Request Validation',
    workflow_dispatch: 'Manual Validation'
}[eventName];

const channel = data.notification?.slackChannel;

// ---------- Validate Inputs ----------

if (!eventTitle) {
    switch (eventName) {
        case 'pull_request':
            generatePRSlack();
            break;

        case 'workflow_dispatch':
            generateManualSlack();
            break;

        case 'push':
            console.log('Push validation does not require Slack payload.');
            break;

        default:
            console.log(`Unsupported event: ${eventName}`);
    }
}

if (!channel) {
    throw new Error('Slack channel is missing.');
}

if (!fs.existsSync(REPORT_FILE)) {
    throw new Error(
        `Master report not found: ${REPORT_FILE}`
    );
}

const report = fs.readFileSync(
    REPORT_FILE,
    'utf8'
).trim();

if (!report) {
    throw new Error('Master report is empty.');
}

// ---------- Parse Master Report ----------

function parseSections(markdown) {
    const sections = [];
    let current = null;

    for (const line of markdown.split('\n')) {
        const match = line.match(/^#{1,6}\s+(.+)$/);

        if (match) {
            current = {
                title: match[1].trim(),
                lines: []
            };

            sections.push(current);
        } else if (current) {
            current.lines.push(line);
        }
    }

    return sections;
}

const sections = parseSections(report);

// ---------- Markdown Helpers ----------

function convertInlineMarkdown(text) {
    return text
        // GitHub links -> Slack links
        .replace(
            /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
            '<$2|$1>'
        )
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '*$1*')
        // Italic
        .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '_$1_');
}

function escapeCell(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ---------- Extract Markdown Tables ----------

function extractTable(lines) {
    const tableLines = lines
        .map(line => line.trim())
        .filter(line =>
            line.startsWith('|') &&
            line.endsWith('|')
        );

    if (tableLines.length < 2) {
        return null;
    }

    const rows = tableLines
        .map(line =>
            line
                .split('|')
                .slice(1, -1)
                .map(escapeCell)
        )
        .filter(row =>
            !row.every(cell => /^:?-{2,}:?$/.test(cell))
        );

    if (rows.length < 2) {
        return null;
    }

    return rows;
}

// ---------- Format Monospaced Table ----------

function formatTable(rows) {
    const columnCount = Math.max(
        ...rows.map(row => row.length)
    );

    const normalizedRows = rows.map(row =>
        Array.from(
            { length: columnCount },
            (_, index) => row[index] || ''
        )
    );

    const widths = Array.from(
        { length: columnCount },
        (_, column) =>
            Math.min(
                28,
                Math.max(
                    4,
                    ...normalizedRows.map(row =>
                        Math.min(28, row[column].length)
                    )
                )
            )
    );

    function formatRow(row) {
        return row.map((cell, index) => {
            const value = cell.length > widths[index]
                ? cell.slice(0, widths[index] - 1) + '…'
                : cell;

            return value.padEnd(widths[index]);
        }).join(' | ');
    }

    const header = formatRow(normalizedRows[0]);

    const separator = widths
        .map(width => '-'.repeat(width))
        .join('-+-');

    const body = normalizedRows
        .slice(1)
        .map(formatRow);

    return [
        '```',
        header,
        separator,
        ...body,
        '```'
    ].join('\n');
}

// ---------- Format Report Links ----------

function formatReportLinks(rows) {
    if (!rows || rows.length < 2) {
        return 'No report links available.';
    }

    return rows.slice(1).map(row => {
        const name = row[0] || 'Report';
        const link = row[1] || '';

        const match = link.match(
            /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/
        );

        if (match) {
            return `*${name}*  <${match[2]}|${match[1]}>`;
        }

        const slackLink = link.match(
            /<(https?:\/\/[^|>]+)\|([^>]+)>/
        );

        if (slackLink) {
            return `*${name}*  <${slackLink[1]}|${slackLink[2]}>`;
        }

        return `*${name}*  ${link || 'Unavailable'}`;
    }).join('\n');
}

// ---------- Render Report Sections ----------

function renderSection(section) {
    const title = section.title;
    const lines = section.lines;

    const rows = extractTable(lines);

    // Report Links: retain clickable URLs.
    if (/report links/i.test(title)) {
        return formatReportLinks(rows);
    }

    // Data sections: use monospaced tables.
    const tableSections = [
        /historical test trend/i,
        /risk overview/i,
        /top risk modules/i,
        /application health/i,
        /scoring breakdown/i,
        /execution metrics/i,
        /pull request details/i,
        /execution overview/i
    ];

    if (rows && tableSections.some(pattern => pattern.test(title))) {
        return formatTable(rows);
    }

    // Other sections retain readable Markdown.
    return lines
        .map(line => {
            const trimmed = line.trim();

            // Remove empty table separators.
            if (/^\|[\s:|-]+\|$/.test(trimmed)) {
                return '';
            }

            // Convert other table rows into readable text.
            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                const cells = trimmed
                    .split('|')
                    .slice(1, -1)
                    .map(escapeCell);

                return `• ${cells.join(' | ')}`;
            }

            // Convert Markdown bullets.
            if (/^[-*]\s+/.test(trimmed)) {
                return `• ${convertInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}`;
            }

            return convertInlineMarkdown(line);
        })
        .join('\n')
        .trim();
}

 // ---------- Build Slack Blocks ----------

const blocks = [];

const MAX_SLACK_BLOCKS = 50;
const TARGET_SLACK_BLOCKS = 45;
const MAX_SECTION_TEXT = 2800;

for (const item of sections) {

    const title = item.title;

    // Do not show PR details in Manual or Push runs.
    if (
        /pull request details/i.test(title) &&
        eventName !== 'pull_request'
    ) {
        continue;
    }

    // Avoid duplicating the master report title.
    if (/^🎭\s*playwright execution summary$/i.test(title)) {
        continue;
    }

    const content = renderSection(item);

    if (!content) {
        continue;
    }

    // Split content to respect Slack section text limits.
    const chunks = [];

    let remaining = content;

    while (remaining.length > MAX_SECTION_TEXT) {

        let splitAt = remaining.lastIndexOf(
            '\n',
            MAX_SECTION_TEXT
        );

        if (splitAt < 1000) {
            splitAt = MAX_SECTION_TEXT;
        }

        chunks.push(
            remaining.slice(0, splitAt)
        );

        remaining = remaining
            .slice(splitAt)
            .trim();
    }

    if (remaining) {
        chunks.push(remaining);
    }

    // Combine title and content into one Slack section block.
    chunks.forEach((chunk, index) => {

        const blockText = index === 0
            ? `*${convertInlineMarkdown(title)}*\n${chunk}`
            : chunk;

        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: blockText
            }
        });
    });
}

// ---------- Validate Slack Block Limits ----------

console.log('Slack Block Validation');
console.log(`Generated Blocks: ${blocks.length}`);
console.log(`Maximum Allowed: ${MAX_SLACK_BLOCKS}`);
console.log(`Target Block Count: ${TARGET_SLACK_BLOCKS}`);

if (blocks.length > MAX_SLACK_BLOCKS) {

    throw new Error(
        `Slack block limit exceeded: ${blocks.length}/${MAX_SLACK_BLOCKS}. ` +
        'Reduce report content or split the notification into multiple messages.'
    );
}

if (blocks.length > TARGET_SLACK_BLOCKS) {
    console.warn(
        `⚠️ Slack block count is above the recommended target: ` +
        `${blocks.length}/${TARGET_SLACK_BLOCKS}.`
    );
}

console.log('Slack block validation passed.');
// ---------- ----------

// ---------- Create Payload ----------

const payload = {
    channel,
    text:
        `Playwright ${eventTitle} | ` +
        `Validation: ${context.buildStatus || 'UNKNOWN'} | ` +
        `Tests: ${metrics.totalTests ?? 0} | ` +
        `Failed: ${metrics.failedTests ?? 0}`,
    blocks
};

// ---------- Select Output File ----------

const outputFile = eventName === 'pull_request'
    ? 'pr-slack.json'
    : 'manual-slack.json';

// ---------- Write Payload ----------

fs.writeFileSync(
    outputFile,
    JSON.stringify(payload, null, 2),
    'utf8'
);

console.log(`Slack payload generated: ${outputFile}`);
console.log(`Event: ${eventTitle}`);
console.log(`Sections: ${sections.length}`);
console.log(`Blocks: ${blocks.length}`);