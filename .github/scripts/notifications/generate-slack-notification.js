const fs = require('fs');

const data = JSON.parse(
    fs.readFileSync('notification-data.json', 'utf8')
);

const context = data.context || {};
const metrics = data.metrics || {};
const pr = data.pr || {};
const slack = data.slack || {};
const links = data.links || {};

const eventTitle = {
    pull_request: 'Pull Request Validation',
    workflow_dispatch: 'Manual Validation',
    push: 'Push Validation'
}[context.eventName] || 'Playwright Validation';

const channel = data.notification?.slackChannel;

function header(text) {
    return {
        type: 'header',
        text: {
            type: 'plain_text',
            text: String(text).slice(0, 150),
            emoji: true
        }
    };
}

function section(text) {
    if (!text) return null;

    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: String(text).slice(0, 3000)
        }
    };
}

function divider() {
    return { type: 'divider' };
}

function addSection(blocks, title, content) {
    if (!content) return;

    blocks.push(
        divider(),
        header(title),
        section(content)
    );
}

// ---------- Main Summary ----------

const blocks = [
    header('🎭 PLAYWRIGHT EXECUTION SUMMARY'),
    section(
        `*${eventTitle}*\n${context.buildText || 'Validation completed.'}`
    ),
    divider(),

    header('❤️ Execution Health'),
    section(context.executionHealth || 'N/A'),

    header('📋 Execution Overview'),
    section([
        `*Browser:* ${context.browser || 'N/A'}`,
        `*Tag:* ${context.executedTag || 'N/A'}`,
        `*Environment:* ${context.environment || 'N/A'}`,
        `*Playwright:* ${context.playwrightVersion || 'N/A'}`,
        `*Node:* ${context.nodeVersion || 'N/A'}`,
        `*Runner OS:* ${context.runnerOS || 'N/A'}`,
        `*Duration:* ${context.executionDuration || 'N/A'}`
    ].join('\n')),

    header('📊 Execution Metrics'),
    section([
        `🧪 Total: *${metrics.totalTests ?? 0}*`,
        `✅ Passed: *${metrics.passedTests ?? 0}* (${metrics.passRate ?? 0}%)`,
        `❌ Failed: *${metrics.failedTests ?? 0}* (${metrics.failureRate ?? 0}%)`,
        `⚠️ Flaky: *${metrics.flakyTests ?? 0}* (${metrics.flakyRate ?? 0}%)`,
        `⏭️ Skipped: *${metrics.skippedTests ?? 0}* (${metrics.skippedRate ?? 0}%)`,
        `🏆 Quality Score: *${metrics.qualityScore ?? 0}%*`
    ].join('\n'))
];

// ---------- Pull Request Details ----------

if (context.eventName === 'pull_request' && pr.number && pr.number !== 'N/A') {
    blocks.push(
        divider(),
        header('📋 Pull Request Details'),
        section([
            `*PR:* <${pr.url}|#${pr.number}>`,
            `*Title:* ${pr.title || 'N/A'}`,
            `*Author:* ${pr.author || 'N/A'}`,
            `*Source:* ${pr.branch || 'N/A'}`,
            `*Target:* ${pr.baseBranch || 'N/A'}`,
            `*Labels:* ${pr.labels || 'N/A'}`
        ].join('\n'))
    );
}

// ---------- Analytics and Risk Reports ----------

const reportSections = [
    ['🛡️ Release Readiness', slack.releaseReadiness],
    ['🖥️ Application Health', slack.applicationHealth],
    ['📦 Module Breakdown', slack.moduleBreakdown],
    ['🏷️ Test Tag Analytics', slack.tagExecution],
    ['🏆 Top Risk Module', slack.topRiskModule],
    ['❌ Failed Modules', slack.failedModules],
    ['❌ Failed Tests', slack.failedTests],
    ['⚠️ Flaky Tests', slack.flakyTests],
    ['⏱️ Slowest Module', slack.slowestModule]
];

for (const [title, content] of reportSections) {
    addSection(blocks, title, content);
}

// ---------- Report Links ----------

const reportLinks = [
    ['GitHub Actions Run', links.runUrl],
    ['Playwright Report', links.playwrightReport],
    ['Test Results', links.testResults],
    ['JSON Results', links.jsonResults],
    ['Allure Results', links.allureResults],
    ['Allure Report', links.allureReport],
    ['Markdown Reports', links.markdownReports]
]
    .filter(([, url]) => url && url !== 'N/A')
    .map(([label, url]) => `<${url}|${label}>`)
    .join(' | ');

addSection(blocks, '🔗 Report Links', reportLinks);

// ---------- Final Payload ----------

if (!channel) {
    throw new Error('Slack channel is missing.');
}

const payload = {
    channel,
    text: `Playwright ${eventTitle} — ${metrics.failedTests ?? 0} failed test(s)`,
    blocks
};

if (blocks.length > 50) {
    throw new Error(
        `Slack Block Kit limit exceeded: ${blocks.length} blocks.`
    );
}

fs.writeFileSync(
    'pr-slack.json',
    JSON.stringify(payload, null, 2),
    'utf8'
);

console.log('Slack notification payload generated successfully.');
console.log(`Event: ${eventTitle}`);
console.log(`Blocks: ${blocks.length}`);