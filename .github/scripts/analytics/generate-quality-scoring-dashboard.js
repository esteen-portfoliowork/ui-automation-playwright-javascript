const fs = require('node:fs');
const path = require('node:path');

const {
    getModuleHealthStatus
} = require('../core/quality-scoring');

// ---------- Constants ----------

const OUTPUT_JSON = 'quality-scoring-dashboard.json';
const OUTPUT_MARKDOWN = 'quality-scoring-dashboard.md';

const VALID_RECOMMENDATIONS = [
    'GO',
    'CONDITIONAL GO',
    'NO-GO',
    'REVIEW REQUIRED'
];

// ---------- Helpers ----------

function toNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}

function formatScore(value) {
    return value === null
        ? 'N/A'
        : `${value.toFixed(2)}/100`;
}

function formatPercent(value) {
    return value === null
        ? 'N/A'
        : `${value.toFixed(2)}%`;
}

function formatCount(value) {
    return value === null
        ? 'N/A'
        : String(value);
}

function escapeMarkdown(value) {
    return String(value ?? 'N/A')
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ');
}

function getValidationType(eventName) {
    const types = {
        pull_request: 'Pull Request Validation',
        workflow_dispatch: 'Manual Validation',
        push: 'Push Validation'
    };

    return types[eventName] || 'Unknown Validation';
}

function getScoreAvailability(score, available) {
    return available && score !== null;
}

// ---------- Build Dashboard ----------

function buildDashboard({
    riskAnalysis,
    releaseRecommendation,
    context = {},
    generatedAt = new Date().toISOString()
}) {
    if (
        !riskAnalysis ||
        typeof riskAnalysis !== 'object'
    ) {
        throw new Error(
            'Invalid risk-analysis data.'
        );
    }

    const readiness =
        riskAnalysis.releaseReadiness || {};

    const metrics =
        readiness.metrics || {};

    const stability =
        riskAnalysis.testStabilityIndex || {};

    const modules =
        Array.isArray(riskAnalysis.modules)
            ? riskAnalysis.modules
            : [];

    const recommendation =
        releaseRecommendation ||
        riskAnalysis.releaseRecommendation ||
        {};

    // ---------- Execution Metrics ----------

    const totalTests = toNumber(metrics.totalTests);
    const executedTests = toNumber(metrics.executedTests);

    const passedTests = toNumber(metrics.passedTests);
    const failedTests = toNumber(metrics.failedTests);
    const flakyTests = toNumber(metrics.flakyTests);
    const skippedTests = toNumber(metrics.skippedTests);

    const executionAvailable =
        totalTests !== null &&
        totalTests > 0;

    const testExecutionQualityScore =
        toNumber(metrics.testExecutionQualityScore);

    const executionQualityAvailable =
        executionAvailable &&
        getScoreAvailability(
            testExecutionQualityScore,
            true
        );

    // ---------- Test Stability Index ----------

    const stabilityScore = toNumber(stability.score);

    const stabilityAvailable =
        stability.available === true &&
        stabilityScore !== null;

    // ---------- Module Health ----------

    const validHealthModules = modules.filter(
        module =>
            toNumber(module.healthScore) !== null
    );

    const weakestModule = validHealthModules.length > 0
        ? [...validHealthModules].sort(
            (a, b) =>
                Number(a.healthScore) -
                Number(b.healthScore)
        )[0]
        : null;

    const lowestModuleHealthScore = weakestModule
        ? Number(weakestModule.healthScore)
        : null;

    const criticalModules = validHealthModules.filter(
        module =>
            Number(module.healthScore) < 50 ||
            /critical/i.test(
                String(module.healthStatus || '')
            )
    );

    const moduleHealthAvailable =
        validHealthModules.length > 0;

    // ---------- Release Quality Score ----------

    const releaseQualityScore = toNumber(
        readiness.qualityScore ??
        readiness.score
    );

    const releaseQualityAvailable =
        readiness.available === true &&
        releaseQualityScore !== null;

    // ---------- Quality Gate ----------

    const qualityGate =
        recommendation.qualityGate || {};

    const gateConfigured =
        typeof qualityGate.configured === 'boolean'
            ? qualityGate.configured
            : null;

    let gateStatus = 'UNKNOWN';

    if (gateConfigured === false) {
        gateStatus =
            qualityGate.status || 'NOT_CONFIGURED';
    } else if (gateConfigured === true) {
        gateStatus =
            qualityGate.status || 'UNKNOWN';
    }

    // ---------- Release Recommendation ----------

    const recommendationStatus =
        VALID_RECOMMENDATIONS.includes(
            recommendation.recommendation
        )
            ? recommendation.recommendation
            : 'REVIEW REQUIRED';

    const recommendationAvailable =
        VALID_RECOMMENDATIONS.includes(
            recommendation.recommendation
        );

    // ---------- Component Breakdown ----------

    const componentQualityScores =
        readiness.componentQualityScores || null;

    const componentScores =
        readiness.componentScores || null;

    const componentWeights =
        readiness.componentWeights || null;

    // ---------- Risk Indicators ----------

    const risks = [];

    function addRisk(severity, title, detail) {
        risks.push({
            severity,
            title,
            detail
        });
    }

    if (failedTests !== null && failedTests > 0) {
        addRisk(
            'CRITICAL',
            'Failed Tests Detected',
            `${failedTests} failed test(s) require investigation.`
        );
    }

    if (flakyTests !== null && flakyTests > 0) {
        addRisk(
            'WARNING',
            'Flaky Tests Detected',
            `${flakyTests} flaky test(s) were detected.`
        );
    }

    if (criticalModules.length > 0) {
        addRisk(
            'CRITICAL',
            'Critical Module Health',
            `${criticalModules.length} module(s) have Critical health status.`
        );
    }

    const attentionModules = validHealthModules.filter(
        module =>
            Number(module.healthScore) >= 50 &&
            Number(module.healthScore) < 75
    );

    if (attentionModules.length > 0) {
        addRisk(
            'WARNING',
            'Modules Need Attention',
            `${attentionModules.length} module(s) have reduced health scores.`
        );
    }

    if (!stabilityAvailable) {
        addRisk(
            'INFO',
            'Test Stability Index Unavailable',
            stability.reason ||
                'Insufficient historical execution data.'
        );
    }

    if (!releaseQualityAvailable) {
        addRisk(
            'WARNING',
            'Release Quality Score Unavailable',
            readiness.reason ||
                'Required release quality metrics are unavailable.'
        );
    }

    if (gateStatus === 'FAILED') {
        addRisk(
            'CRITICAL',
            'Quality Gate Failed',
            'One or more configured Quality Gates failed.'
        );
    } else if (gateStatus === 'WARNING') {
        addRisk(
            'WARNING',
            'Quality Gate Warning',
            'The Quality Gate completed with warnings.'
        );
    } else if (
        gateConfigured === false ||
        gateStatus === 'NOT_CONFIGURED'
    ) {
        addRisk(
            'INFO',
            'Quality Gate Not Configured',
            'Quality Gate evaluation is not yet configured.'
        );
    }

    if (recommendationStatus === 'NO-GO') {
        addRisk(
            'CRITICAL',
            'Release Recommendation: NO-GO',
            'The release recommendation engine identified a release blocker.'
        );
    } else if (
        recommendationStatus === 'REVIEW REQUIRED'
    ) {
        addRisk(
            'WARNING',
            'Release Review Required',
            'Required quality information is unavailable or insufficient.'
        );
    } else if (
        recommendationStatus === 'CONDITIONAL GO'
    ) {
        addRisk(
            'WARNING',
            'Conditional Release Recommendation',
            'Outstanding quality concerns should be reviewed.'
        );
    }

    // ---------- Final Dashboard Structure ----------

    return {
        schemaVersion: '1.0.0',

        generatedAt,

        context: {
            eventName: context.eventName || 'unknown',

            validationType: getValidationType(
                context.eventName
            ),

            repository: context.repository || 'N/A',
            runNumber: context.runNumber || 'N/A',

            browser: context.browser || 'N/A',
            environment: context.environment || 'N/A',
            executedTag: context.executedTag || 'N/A'
        },

        availability: {
            executionMetrics: executionAvailable,
            testExecutionQualityScore:
                executionQualityAvailable,
            testStabilityIndex: stabilityAvailable,
            moduleHealth: moduleHealthAvailable,
            releaseQualityScore: releaseQualityAvailable,
            qualityGate: gateStatus !== 'UNKNOWN',
            releaseRecommendation: recommendationAvailable
        },

        execution: {
            totalTests,
            executedTests,
            passedTests,
            failedTests,
            flakyTests,
            skippedTests,

            passRate: toNumber(metrics.passRate),
            failureRate: toNumber(metrics.failureRate),
            flakyRate: toNumber(metrics.flakyRate),

            testExecutionQualityScore:
                executionQualityAvailable
                    ? testExecutionQualityScore
                    : null
        },

        scores: {
            testExecutionQuality: {
                available: executionQualityAvailable,
                score: executionQualityAvailable
                    ? testExecutionQualityScore
                    : null,
                source:
                    'risk-analysis.releaseReadiness.metrics.testExecutionQualityScore'
            },

            testStabilityIndex: {
                available: stabilityAvailable,
                score: stabilityAvailable
                    ? stabilityScore
                    : null,
                status: stability.status || 'UNKNOWN',
                reason: stability.reason || null,
                runsAnalyzed:
                    toNumber(stability.runsAnalyzed)
            },

            moduleHealth: {
                available: moduleHealthAvailable,

                lowestModuleHealthScore,

                status: moduleHealthAvailable
                    ? getModuleHealthStatus(
                        lowestModuleHealthScore
                    )
                    : '⚪ Unknown',

                modulesAnalyzed: modules.length,

                scoredModules:
                    validHealthModules.length,

                criticalModuleCount:
                    criticalModules.length,

                weakestModule: weakestModule
                    ? {
                        application: weakestModule.application,
                        module: weakestModule.module,
                        healthScore: lowestModuleHealthScore,
                        healthStatus:
                            weakestModule.healthStatus
                    }
                    : null,

                modules: modules.map(module => ({
                    application: module.application,
                    module: module.module,

                    executed: toNumber(module.executed),
                    failed: toNumber(module.failed),
                    flaky: toNumber(module.flaky),

                    riskScore: toNumber(module.riskScore),
                    riskLevel: module.riskLevel || 'Unknown',

                    healthScore: toNumber(module.healthScore),
                    healthStatus:
                        module.healthStatus || '⚪ Unknown'
                }))
            },

            releaseQuality: {
                available: releaseQualityAvailable,

                score: releaseQualityAvailable
                    ? releaseQualityScore
                    : null,

                status: readiness.status || 'UNKNOWN',

                reason: readiness.reason || null,

                componentQualityScores:
                    releaseQualityAvailable
                        ? componentQualityScores
                        : null,

                componentScores:
                    releaseQualityAvailable
                        ? componentScores
                        : null,

                componentWeights:
                    releaseQualityAvailable
                        ? componentWeights
                        : null
            }
        },

        qualityGate: {
            configured: gateConfigured,
            status: gateStatus
        },

        recommendation: {
            available: recommendationAvailable,

            status: recommendationStatus,

            explanation:
                recommendation.explanation ||
                'Release recommendation information is unavailable.',

            reasons: Array.isArray(recommendation.reasons)
                ? recommendation.reasons
                : [],

            actions: Array.isArray(recommendation.actions)
                ? recommendation.actions
                : []
        },

        risks,

        summary: {
            totalModulesAnalyzed: modules.length,
            scoredModules: validHealthModules.length,
            criticalModules: criticalModules.length,
            totalRiskIndicators: risks.length
        }
    };
}

// ---------- Render Markdown ----------

function renderMarkdown(dashboard) {
    const execution = dashboard.execution;
    const scores = dashboard.scores;

    const moduleHealth = scores.moduleHealth;
    const releaseQuality = scores.releaseQuality;

    const lines = [
        '# 🏆 Quality Scoring Dashboard',
        '',
        `> Schema Version: ${dashboard.schemaVersion}`,
        `> Generated: ${dashboard.generatedAt}`,
        '',
        '## 📋 Execution Context',
        '',
        '| Item | Value |',
        '|---|---|',
        `| Validation Type | ${escapeMarkdown(dashboard.context.validationType)} |`,
        `| Event | ${escapeMarkdown(dashboard.context.eventName)} |`,
        `| Repository | ${escapeMarkdown(dashboard.context.repository)} |`,
        `| Run Number | ${escapeMarkdown(dashboard.context.runNumber)} |`,
        `| Browser | ${escapeMarkdown(dashboard.context.browser)} |`,
        `| Environment | ${escapeMarkdown(dashboard.context.environment)} |`,
        `| Executed Tag | ${escapeMarkdown(dashboard.context.executedTag)} |`,
        '',
        '## 🏆 Quality Score Overview',
        '',
        '| Quality Indicator | Score / Status | Availability |',
        '|---|---:|---|',
        `| Test Execution Quality Score | ${formatScore(scores.testExecutionQuality.score)} | ${scores.testExecutionQuality.available ? 'Available' : 'Unavailable'} |`,
        `| Test Stability Index | ${formatScore(scores.testStabilityIndex.score)} | ${scores.testStabilityIndex.available ? 'Available' : 'Unavailable'} |`,
        `| Module Health Score (Lowest) | ${formatScore(moduleHealth.lowestModuleHealthScore)} | ${moduleHealth.available ? 'Available' : 'Unavailable'} |`,
        `| Release Quality Score | ${formatScore(releaseQuality.score)} | ${releaseQuality.available ? 'Available' : 'Unavailable'} |`,
        `| Quality Gate | ${escapeMarkdown(dashboard.qualityGate.status)} | ${dashboard.qualityGate.configured === null ? 'Unknown' : dashboard.qualityGate.configured ? 'Configured' : 'Not Configured'} |`,
        `| Release Recommendation | ${escapeMarkdown(dashboard.recommendation.status)} | ${dashboard.recommendation.available ? 'Available' : 'Unavailable'} |`,
        '',
        '## 📊 Test Execution Metrics',
        '',
        '| Metric | Value |',
        '|---|---:|',
        `| Total Tests | ${formatCount(execution.totalTests)} |`,
        `| Executed Tests | ${formatCount(execution.executedTests)} |`,
        `| Passed Tests | ${formatCount(execution.passedTests)} |`,
        `| Failed Tests | ${formatCount(execution.failedTests)} |`,
        `| Flaky Tests | ${formatCount(execution.flakyTests)} |`,
        `| Skipped Tests | ${formatCount(execution.skippedTests)} |`,
        `| Pass Rate | ${formatPercent(execution.passRate)} |`,
        `| Failure Rate | ${formatPercent(execution.failureRate)} |`,
        `| Flaky Rate | ${formatPercent(execution.flakyRate)} |`,
        `| Test Execution Quality Score | ${formatScore(execution.testExecutionQualityScore)} |`,
        '',
        '## 📈 Test Stability Index',
        '',
        `- **Score:** ${formatScore(scores.testStabilityIndex.score)}`,
        `- **Status:** ${escapeMarkdown(scores.testStabilityIndex.status)}`,
        `- **Runs Analyzed:** ${formatCount(scores.testStabilityIndex.runsAnalyzed)}`,
        `- **Availability Reason:** ${escapeMarkdown(scores.testStabilityIndex.reason || 'N/A')}`,
        '',
        '## 🏥 Module Health Overview',
        '',
        `- **Lowest Module Health Score:** ${formatScore(moduleHealth.lowestModuleHealthScore)}`,
        `- **Health Status:** ${escapeMarkdown(moduleHealth.status)}`,
        `- **Modules Analyzed:** ${moduleHealth.modulesAnalyzed}`,
        `- **Modules with Health Scores:** ${moduleHealth.scoredModules}`,
        `- **Critical Modules:** ${moduleHealth.criticalModuleCount}`,
        ''
    ];

    if (moduleHealth.weakestModule) {
        lines.push(
            `- **Weakest Module:** ${escapeMarkdown(moduleHealth.weakestModule.application)} / ${escapeMarkdown(moduleHealth.weakestModule.module)}`,
            ''
        );
    }

    lines.push(
        '| Application | Module | Executed | Failed | Flaky | Risk Score | Health Score | Health Status |',
        '|---|---|---:|---:|---:|---:|---:|---|'
    );

    for (const module of moduleHealth.modules.slice(0, 10)) {
        lines.push(
            `| ${escapeMarkdown(module.application)} | ${escapeMarkdown(module.module)} | ${formatCount(module.executed)} | ${formatCount(module.failed)} | ${formatCount(module.flaky)} | ${formatPercent(module.riskScore)} | ${formatScore(module.healthScore)} | ${escapeMarkdown(module.healthStatus)} |`
        );
    }

    if (moduleHealth.modules.length === 0) {
        lines.push('| N/A | No module data available | N/A | N/A | N/A | N/A | N/A | ⚪ Unknown |');
    }

    lines.push(
        '',
        '## 🏆 Release Quality Score Breakdown',
        ''
    );

    const componentRows = [
        ['Pass Rate', 'passRate', 'passRate'],
        ['Failure Rate', 'failureRate', 'failureRate'],
        ['Flaky Rate', 'flakyRate', 'flakyRate'],
        ['Module Health', 'moduleHealth', 'moduleRisk'],
        ['Performance', 'performance', 'performance']
    ];

    if (
        releaseQuality.available &&
        releaseQuality.componentQualityScores &&
        releaseQuality.componentScores &&
        releaseQuality.componentWeights
    ) {
        lines.push(
            '| Component | Quality Score | Weight | Weighted Points |',
            '|---|---:|---:|---:|'
        );

        for (const [label, scoreKey, weightKey] of componentRows) {
            const quality =
                toNumber(
                    releaseQuality.componentQualityScores[scoreKey]
                );

            const weight =
                toNumber(
                    releaseQuality.componentWeights[weightKey]
                );

            const weighted =
                toNumber(
                    releaseQuality.componentScores[scoreKey]
                );

            lines.push(
                `| ${label} | ${formatScore(quality)} | ${weight === null ? 'N/A' : `${weight}%`} | ${weighted === null ? 'N/A' : weighted.toFixed(2)} |`
            );
        }

        lines.push(
            '',
            `**Total Release Quality Score: ${formatScore(releaseQuality.score)}**`
        );
    } else {
        lines.push(
            'Release Quality Score component breakdown is unavailable.'
        );
    }

    lines.push(
        '',
        '## 🚦 Quality Gate',
        '',
        `- **Configured:** ${dashboard.qualityGate.configured === null ? 'Unknown' : dashboard.qualityGate.configured ? 'Yes' : 'No'}`,
        `- **Status:** ${escapeMarkdown(dashboard.qualityGate.status)}`,
        ''
    );

    lines.push(
        '## 🤖 Release Recommendation',
        '',
        `**Recommendation: ${escapeMarkdown(dashboard.recommendation.status)}**`,
        '',
        dashboard.recommendation.explanation,
        '',
        '### Reasons',
        '',
        ...(dashboard.recommendation.reasons.length
            ? dashboard.recommendation.reasons.map(
                reason => `- ${escapeMarkdown(reason)}`
            )
            : ['- No recommendation reasons available.']),
        '',
        '### Recommended Actions',
        '',
        ...(dashboard.recommendation.actions.length
            ? dashboard.recommendation.actions.map(
                action => `- ${escapeMarkdown(action)}`
            )
            : ['- No recommended actions available.']),
        '',
        '## ⚠️ Quality Risks Requiring Attention',
        ''
    );

    if (dashboard.risks.length > 0) {
        lines.push(
            '| Severity | Risk | Details |',
            '|---|---|---|'
        );

        for (const risk of dashboard.risks) {
            lines.push(
                `| ${risk.severity} | ${escapeMarkdown(risk.title)} | ${escapeMarkdown(risk.detail)} |`
            );
        }
    } else {
        lines.push('✅ No quality risks identified.');
    }

    lines.push(
        '',
        '---',
        '',
        '> Scores are sourced from the existing analytics and risk-analysis outputs. Unavailable scores are displayed as N/A and are not interpreted as zero.',
        ''
    );

    return lines.join('\n');
}

// ---------- Generate Dashboard ----------

function generateDashboard({
    riskAnalysis,
    releaseRecommendation,
    context = {},
    outputDir = process.cwd(),
    generatedAt
}) {
    const dashboard = buildDashboard({
        riskAnalysis,
        releaseRecommendation,
        context,
        generatedAt
    });

    const markdown = renderMarkdown(dashboard);

    fs.mkdirSync(outputDir, {
        recursive: true
    });

    const jsonPath = path.join(
        outputDir,
        OUTPUT_JSON
    );

    const markdownPath = path.join(
        outputDir,
        OUTPUT_MARKDOWN
    );

    fs.writeFileSync(
        jsonPath,
        JSON.stringify(dashboard, null, 2),
        'utf8'
    );

    fs.writeFileSync(
        markdownPath,
        markdown,
        'utf8'
    );

    console.log('🏆 Quality Scoring Dashboard Generated');
    console.log(`JSON: ${jsonPath}`);
    console.log(`Markdown: ${markdownPath}`);

    return {
        dashboard,
        markdown,
        jsonPath,
        markdownPath
    };
}

// ---------- Main ----------

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

function main() {
    const riskAnalysis = readJson(
        'risk-analysis.json'
    );

    const recommendation =
        readJson(
            'release-recommendations.json',
            false
        ) ||
        riskAnalysis.releaseRecommendation;

    generateDashboard({
        riskAnalysis,

        releaseRecommendation: recommendation,

        context: {
            eventName:
                process.env.GITHUB_EVENT_NAME || 'unknown',

            repository:
                process.env.GITHUB_REPOSITORY || 'N/A',

            runNumber:
                process.env.GITHUB_RUN_NUMBER || 'N/A',

            browser:
                process.env.BROWSER || 'N/A',

            environment:
                process.env.ENVIRONMENT || 'N/A',

            executedTag:
                process.env.EXECUTED_TAG || 'N/A'
        }
    });
}

if (require.main === module) {
    main();
}

module.exports = {
    buildDashboard,
    renderMarkdown,
    generateDashboard
};