const fs = require('node:fs');
const path = require('node:path');

const {
    evaluateQualityGates
} = require('../core/quality-gates');

const {
    generateReleaseRecommendation
} = require('../core/release-recommendations');

const CONFIG_PATH =
    '.github/config/quality-gates.json';

const RISK_PATH = 'risk-analysis.json';

const GATE_JSON_PATH = 'quality-gates.json';
const GATE_MD_PATH = 'quality-gates.md';

const RECOMMENDATION_JSON_PATH =
    'release-recommendations.json';

const RECOMMENDATION_MD_PATH =
    'release-recommendations.md';

// ---------- Helpers ----------

function readJson(file, required = true) {
    if (!fs.existsSync(file)) {
        if (required) {
            throw new Error(`Required file not found: ${file}`);
        }

        return null;
    }

    return JSON.parse(
        fs.readFileSync(file, 'utf8')
    );
}

function writeJson(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2) + '\n',
        'utf8'
    );
}

function escapeMarkdown(value) {
    return String(value ?? 'N/A')
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ');
}

function getReportingFileStatus(files) {
    const status = {};

    for (const file of files) {
        try {
            const data = readJson(file);

            status[file] =
                Boolean(
                    data &&
                    typeof data === 'object' &&
                    !Array.isArray(data)
                );
        } catch {
            status[file] = false;
        }
    }

    return status;
}

// ---------- Gate Markdown ----------

function renderGateMarkdown(gates) {
    const lines = [
        '',
        `- **Status:** ${gates.status}`,
        `- **Configured:** ${gates.configured ? 'Yes' : 'No'}`,
        `- **Evaluated At:** ${gates.evaluatedAt}`,
        '',
        '## 📊 Gate Summary',
        '',
        '| Total | Passed | Failed | Unavailable | Skipped |',
        '|---:|---:|---:|---:|---:|',
        `| ${gates.summary.total} | ${gates.summary.passed} | ${gates.summary.failed} | ${gates.summary.unavailable} | ${gates.summary.skipped} |`,
        '',
        '## 🔍 Individual Gate Results',
        '',
        '| Criterion | Actual | Rule | Expected | Status | Explanation |',
        '|---|---:|---|---:|---|---|'
    ];

    for (const result of gates.results) {
        lines.push(
            `| ${escapeMarkdown(result.name)} | ${escapeMarkdown(result.actual)} | ${escapeMarkdown(result.operator)} | ${escapeMarkdown(result.expected)} | ${result.status} | ${escapeMarkdown(result.explanation)} |`
        );

        if (Array.isArray(result.files)) {
            for (const file of result.files) {
                lines.push(
                    `| └ ${escapeMarkdown(file.file)} | ${file.available ? 'Available' : 'Unavailable'} | Required | Yes | ${file.status} | ${escapeMarkdown(file.explanation)} |`
                );
            }
        }
    }

    lines.push(
        '',
        '## 📝 Evaluation Explanation',
        '',
        gates.explanation,
        '',
        '---',
        '',
        '> Quality Gate evaluation is advisory in Issue 06. CI/CD enforcement is implemented separately in Issue 07.',
        ''
    );

    return lines.join('\n');
}

// ---------- Recommendation Markdown ----------

function renderRecommendationMarkdown(recommendation) {
    const emojis = {
        'GO': '🟢',
        'CONDITIONAL GO': '🟡',
        'NO-GO': '🔴',
        'REVIEW REQUIRED': '⚪'
    };

    const emoji =
        emojis[recommendation.recommendation] || '⚪';

    const metrics = recommendation.metrics || {};
    const gate = recommendation.qualityGate || {};

    return [
        '',
        `## ${emoji} ${recommendation.recommendation}`,
        '',
        '### Explanation',
        '',
        recommendation.explanation,
        '',
        '### Recommendation Reasons',
        '',
        ...recommendation.reasons.map(
            reason => `- ${reason}`
        ),
        '',
        '### Recommended Actions',
        '',
        ...recommendation.actions.map(
            action => `- [ ] ${action}`
        ),
        '',
        '### Quality Metrics',
        '',
        '| Metric | Value |',
        '|---|---:|',
        `| Release Quality Score | ${metrics.releaseQualityScore ?? 'N/A'} |`,
        `| Test Stability Index | ${metrics.testStabilityIndex ?? 'N/A'} |`,
        `| Executed Tests | ${metrics.executedTests ?? 'N/A'} |`,
        `| Failed Tests | ${metrics.failedTests ?? 'N/A'} |`,
        `| Failure Rate | ${metrics.failureRate ?? 'N/A'}% |`,
        `| Lowest Module Health Score | ${metrics.lowestModuleHealthScore ?? 'N/A'} |`,
        `| Critical Modules | ${metrics.criticalModuleCount ?? 'N/A'} |`,
        '',
        '### Quality Gate',
        '',
        `- Configured: ${gate.configured}`,
        `- Status: ${gate.status}`,
        '',
        '### Governance Notice',
        '',
        'This recommendation is advisory. It does not automatically approve, reject, or deploy a release.',
        '',
        `Generated: ${recommendation.evaluatedAt}`,
        ''
    ].join('\n');
}

// ---------- Main ----------

function main() {
    const config = readJson(CONFIG_PATH);

    const riskAnalysis =
        readJson(RISK_PATH, false) || {};

    const requiredFiles =
        config.reportingData?.requiredFiles || [];

    const reportingFiles =
        getReportingFileStatus(requiredFiles);

    const gates = evaluateQualityGates({
        riskAnalysis,
        config,
        reportingFiles
    });

    gates.evaluatedAt = new Date().toISOString();

    // ---------- Save Quality Gate Outputs ----------

    writeJson(GATE_JSON_PATH, gates);

    fs.writeFileSync(
        GATE_MD_PATH,
        renderGateMarkdown(gates) + '\n',
        'utf8'
    );

    // ---------- Update Release Recommendation ----------

    const readiness =
        riskAnalysis.releaseReadiness || {};

    const executionMetrics =
        readiness.metrics || {};

    const recommendation = generateReleaseRecommendation({
        releaseQuality: readiness,

        testStability:
            riskAnalysis.testStabilityIndex,

        modules:
            Array.isArray(riskAnalysis.modules)
                ? riskAnalysis.modules
                : [],

        execution: {
            executedTests:
                Number(executionMetrics.executedTests),

            failedTests:
                Number(executionMetrics.failedTests),

            failureRate:
                Number(executionMetrics.failureRate)
        },

        qualityGate: {
            configured: gates.configured,
            status: gates.status,
            failedGates: gates.summary.failed,
            unavailableGates: gates.summary.unavailable,
            evaluatedAt: gates.evaluatedAt
        }
    });

    // ---------- Update Central Risk Analysis ----------

    riskAnalysis.qualityGate = gates;
    riskAnalysis.releaseRecommendation = recommendation;

    if (fs.existsSync(RISK_PATH)) {
        writeJson(RISK_PATH, riskAnalysis);
    }

    writeJson(
        RECOMMENDATION_JSON_PATH,
        recommendation
    );

    fs.writeFileSync(
        RECOMMENDATION_MD_PATH,
        renderRecommendationMarkdown(recommendation),
        'utf8'
    );

    // ---------- Console Summary ----------

    console.log('\n🚦 Quality Gate Evaluation');
    console.log('------------------------------');
    console.log(`Status: ${gates.status}`);
    console.log(`Passed: ${gates.summary.passed}`);
    console.log(`Failed: ${gates.summary.failed}`);
    console.log(`Unavailable: ${gates.summary.unavailable}`);
    console.log(`Skipped: ${gates.summary.skipped}`);
    console.log('------------------------------');

    console.log(
        `Release Recommendation: ${recommendation.recommendation}`
    );

    console.log('\nQuality Gate evaluation completed.');
    console.log('CI/CD enforcement is not enabled in Issue 06.');
}

if (require.main === module) {
    main();
}

module.exports = {
    renderGateMarkdown,
    renderRecommendationMarkdown,
    getReportingFileStatus
};