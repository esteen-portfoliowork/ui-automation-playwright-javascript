
const fs = require('fs');

const data = JSON.parse(
    fs.readFileSync('notification-data.json', 'utf8')
);

const context = data.context;
const metrics = data.metrics;
const pr = data.pr;
const slack = data.slack;

const eventTitle = {
    pull_request: 'Pull Request Validation',
    workflow_dispatch: 'Manual Validation',
    push: 'Push Validation'
}[context.eventName] || 'Playwright Validation';

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

const blocks = [
    header('🎭 PLAYWRIGHT EXECUTION SUMMARY'),
    section(`${context.buildEmoji} *${eventTitle}*\n${context.buildText}`),
    divider(),

    header('❤️ Execution Health'),
    section(context.executionHealth),

    header('📋 Execution Overview'),
    section([
        `*Browser:* ${context.browser}`,
        `*Tag:* ${context.executedTag}`,
        `*Environment:* ${context.environment}`,
        `*Playwright:* ${context.playwrightVersion}`,
        `*Node:* ${context.nodeVersion}`,
        `*Runner OS:* ${context.runnerOs}`,
        `*Duration:* ${context.executionDuration}`
    ].join('\n')),

    header('📊 Execution Metrics'),
    section([
        `🧪 Total: *${metrics.total}*`,
        `✅ Passed: *${metrics.passed}* (${metrics.passRate}%)`,
        `❌ Failed: *${metrics.failed}* (${metrics.failureRate}%)`,
        `⚠️ Flaky: *${metrics.flaky}* (${metrics.flakyRate}%)`,
        `⏭️ Skipped: *${metrics.skipped}* (${metrics.skippedRate}%)`,
        `🏆 Quality Score: *${metrics.qualityScore}%*`
    ].join('\n'))
];

if (pr.number) {
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
    if (content) {
        blocks.push(
            divider(),
            header(title),
            section(content)
        );
    }
}

if (data.reportLinks) {
    blocks.push(
        divider(),
        header('🔗 Report Links'),
        section(data.reportLinks)
    );
}

const payload = {
    channel: data.slackChannel,
    text: `Playwright ${eventTitle} — ${context.buildText}`,
    blocks
};

if (!payload.channel) {
    throw new Error('Slack channel is missing.');
}

fs.writeFileSync(
    'pr-slack.json',
    JSON.stringify(payload, null, 2),
    'utf8'
);

console.log('Slack payload generated successfully.');