const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
    buildDashboard,
    renderMarkdown,
    generateDashboard
} = require('./generate-quality-scoring-dashboard');

console.log('\n🏆 Quality Scoring Dashboard Tests\n');

let passed = 0;

function test(name, callback) {
    try {
        callback();
        passed++;
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}`);
        throw error;
    }
}

// ---------- Fixture ----------

function createFixture() {
    return {
        riskAnalysis: {
            testStabilityIndex: {
                available: true,
                score: 92,
                status: 'STABLE',
                historicalFlakyRate: 8,
                runsAnalyzed: 10
            },

            modules: [
                {
                    application: 'SauceDemo',
                    module: 'login',
                    executed: 20,
                    failed: 0,
                    flaky: 0,
                    riskScore: 0,
                    riskLevel: '🟢 Healthy',
                    healthScore: 100,
                    healthStatus: '🟢 Healthy'
                },
                {
                    application: 'SauceDemo',
                    module: 'checkout',
                    executed: 20,
                    failed: 4,
                    flaky: 2,
                    riskScore: 17,
                    riskLevel: '🟡 Moderate',
                    healthScore: 83,
                    healthStatus: '🔵 Good'
                },
                {
                    application: 'SauceDemo',
                    module: 'inventory',
                    executed: 20,
                    failed: 5,
                    flaky: 3,
                    riskScore: 28,
                    riskLevel: '🟠 High',
                    healthScore: 72,
                    healthStatus: '🟡 Needs Attention'
                }
            ],

            releaseReadiness: {
                available: true,
                status: 'CONDITIONAL GO',
                qualityScore: 88.25,
                score: 88.25,
                reason: 'Outstanding quality concerns require review.',

                metrics: {
                    totalTests: 100,
                    executedTests: 95,
                    passedTests: 88,
                    failedTests: 2,
                    flakyTests: 5,
                    skippedTests: 5,

                    passRate: 93,
                    failureRate: 2,
                    flakyRate: 5,

                    testExecutionQualityScore: 90,
                    lowestModuleHealthScore: 72,
                    averageTestDurationMs: 5000
                },

                componentQualityScores: {
                    passRate: 95,
                    failureRate: 98,
                    flakyRate: 65,
                    moduleHealth: 72,
                    performance: 50
                },

                componentScores: {
                    passRate: 38,
                    failureRate: 24.5,
                    flakyRate: 9.75,
                    moduleHealth: 7.2,
                    performance: 5
                },

                componentWeights: {
                    passRate: 40,
                    failureRate: 25,
                    flakyRate: 15,
                    moduleRisk: 10,
                    performance: 10
                }
            }
        },

        releaseRecommendation: {
            recommendation: 'CONDITIONAL GO',

            explanation:
                'Release requires review of outstanding quality concerns.',

            reasons: [
                'Test stability requires attention.'
            ],

            actions: [
                'Investigate flaky tests.'
            ],

            qualityGate: {
                configured: false,
                status: 'NOT_CONFIGURED'
            }
        },

        qualityGateEvaluation: {
            configured: true,
            status: 'PASSED',
            summary: {
                total: 9,
                passed: 9,
                failed: 0,
                unavailable: 0,
                skipped: 0
            },
            results: [
                {
                    id: 'minimumTestCount',
                    name: 'Minimum Executed Test Count',
                    actual: 95,
                    expected: 1,
                    status: 'PASSED',
                    explanation: 'Minimum test count is satisfied.'
                },
                {
                    id: 'minimumPassRate',
                    name: 'Minimum Pass Rate',
                    actual: 93,
                    expected: 95,
                    status: 'FAILED',
                    explanation: 'Pass rate is below the threshold.'
                }
            ]
        }
    };
}

// ---------- Score Integration ----------

test('All required quality scores are populated from source data', () => {
    const fixture = createFixture();

    const dashboard = buildDashboard({
        ...fixture,
        context: {
            eventName: 'pull_request'
        }
    });

    assert.equal(
        dashboard.scores.testExecutionQuality.score,
        90
    );

    assert.equal(
        dashboard.scores.testStabilityIndex.score,
        92
    );

    assert.equal(
        dashboard.scores.moduleHealth.lowestModuleHealthScore,
        72
    );

    assert.equal(
        dashboard.scores.releaseQuality.score,
        88.25
    );
});

test('Dashboard preserves Release Quality component scores', () => {
    const fixture = createFixture();

    const dashboard = buildDashboard(fixture);

    assert.equal(
        dashboard.scores.releaseQuality.componentQualityScores.flakyRate,
        65
    );

    assert.equal(
        dashboard.scores.releaseQuality.componentScores.moduleHealth,
        7.2
    );

    assert.equal(
        dashboard.scores.releaseQuality.componentWeights.performance,
        10
    );
});

// ---------- Availability ----------

test('Missing execution quality score is unavailable, not zero', () => {
    const fixture = createFixture();

    delete fixture.riskAnalysis.releaseReadiness
        .metrics.testExecutionQualityScore;

    const dashboard = buildDashboard(fixture);

    assert.equal(
        dashboard.scores.testExecutionQuality.available,
        false
    );

    assert.equal(
        dashboard.scores.testExecutionQuality.score,
        null
    );
});

test('Missing TSI remains unavailable', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.testStabilityIndex = {
        available: false,
        score: null,
        status: 'UNKNOWN',
        reason: 'Insufficient historical execution data.',
        runsAnalyzed: 2
    };

    const dashboard = buildDashboard(fixture);

    assert.equal(
        dashboard.scores.testStabilityIndex.available,
        false
    );

    assert.equal(
        dashboard.scores.testStabilityIndex.score,
        null
    );
});

test('Missing module health scores remain unavailable', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.modules = [
        {
            application: 'SauceDemo',
            module: 'login',
            healthScore: null,
            healthStatus: '⚪ Unknown'
        }
    ];

    const dashboard = buildDashboard(fixture);

    assert.equal(
        dashboard.scores.moduleHealth.available,
        false
    );

    assert.equal(
        dashboard.scores.moduleHealth.lowestModuleHealthScore,
        null
    );
});

test('Unavailable Release Quality Score is not represented as zero', () => {
    const fixture = createFixture();

    fixture.riskAnalysis.releaseReadiness.available = false;
    fixture.riskAnalysis.releaseReadiness.qualityScore = null;

    const dashboard = buildDashboard(fixture);

    assert.equal(
        dashboard.scores.releaseQuality.available,
        false
    );

    assert.equal(
        dashboard.scores.releaseQuality.score,
        null
    );
});

// ---------- Quality Gate & Recommendation ----------

test('Quality Gate status is preserved', () => {
    const fixture = createFixture();

    const dashboard = buildDashboard(fixture);

    assert.equal(
        dashboard.qualityGate.configured,
        false
    );

    assert.equal(
        dashboard.qualityGate.status,
        'NOT_CONFIGURED'
    );
});

test('Release recommendation is included', () => {
    const fixture = createFixture();

    const dashboard = buildDashboard(fixture);

    assert.equal(
        dashboard.recommendation.status,
        'CONDITIONAL GO'
    );

    assert.ok(
        dashboard.recommendation.reasons.length > 0
    );

    assert.ok(
        dashboard.recommendation.actions.length > 0
    );
});

test('Missing recommendation defaults to REVIEW REQUIRED', () => {
    const fixture = createFixture();

    fixture.releaseRecommendation = null;
    delete fixture.riskAnalysis.releaseRecommendation;

    const dashboard = buildDashboard(fixture);

    assert.equal(
        dashboard.recommendation.status,
        'REVIEW REQUIRED'
    );

    assert.equal(
        dashboard.recommendation.available,
        false
    );
});

// ---------- Risk Indicators ----------

test('Dashboard identifies failed and flaky test risks', () => {
    const fixture = createFixture();

    const dashboard = buildDashboard(fixture);

    assert.ok(
        dashboard.risks.some(
            risk => risk.title === 'Failed Tests Detected'
        )
    );

    assert.ok(
        dashboard.risks.some(
            risk => risk.title === 'Flaky Tests Detected'
        )
    );
});

test('Dashboard identifies modules requiring attention', () => {
    const fixture = createFixture();

    const dashboard = buildDashboard(fixture);

    assert.ok(
        dashboard.risks.some(
            risk => risk.title === 'Modules Need Attention'
        )
    );
});

// ---------- Event Compatibility ----------

for (const eventName of [
    'pull_request',
    'workflow_dispatch',
    'push'
]) {
    test(`Supports ${eventName} validation`, () => {
        const fixture = createFixture();

        const dashboard = buildDashboard({
            ...fixture,
            context: {
                eventName
            }
        });

        assert.equal(
            dashboard.context.eventName,
            eventName
        );

        assert.ok(
            dashboard.context.validationType
        );
    });
}

// ---------- Markdown ----------

test('Markdown includes all required dashboard sections', () => {
    const fixture = createFixture();

    const dashboard = buildDashboard(fixture);

    const markdown = renderMarkdown(dashboard);

    const requiredSections = [
        'Quality Scoring Dashboard',
        'Quality Score Overview',
        'Test Execution Metrics',
        'Test Stability Index',
        'Module Health Overview',
        'Release Quality Score Breakdown',
        'Quality Gate',
        'Release Recommendation',
        'Quality Risks Requiring Attention'
    ];

    for (const section of requiredSections) {
        assert.ok(
            markdown.includes(section),
            `Missing Markdown section: ${section}`
        );
    }
});

test('Markdown uses N/A for unavailable scores', () => {
    const fixture = createFixture();

    delete fixture.riskAnalysis.releaseReadiness
        .metrics.testExecutionQualityScore;

    const dashboard = buildDashboard(fixture);

    const markdown = renderMarkdown(dashboard);

    assert.match(
        markdown,
        /Test Execution Quality Score \| N\/A/
    );
});

// ---------- File Generation ----------

test('Generator creates JSON and Markdown files', () => {
    const fixture = createFixture();

    const outputDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'quality-dashboard-')
    );

    try {
        const result = generateDashboard({
            ...fixture,
            outputDir,
            generatedAt: '2026-11-25T00:00:00.000Z'
        });

        assert.ok(
            fs.existsSync(result.jsonPath)
        );

        assert.ok(
            fs.existsSync(result.markdownPath)
        );

        const savedJson = JSON.parse(
            fs.readFileSync(result.jsonPath, 'utf8')
        );

        const savedMarkdown = fs.readFileSync(
            result.markdownPath,
            'utf8'
        );

        assert.equal(
            savedJson.scores.releaseQuality.score,
            88.25
        );

        assert.equal(
            savedJson.scores.testExecutionQuality.score,
            90
        );

        assert.ok(
            savedMarkdown.includes('88.25/100')
        );

    } finally {
        fs.rmSync(outputDir, {
            recursive: true,
            force: true
        });
    }
});

// ---------- QUality Gate evaluation ----------

test('Dashboard uses the actual Quality Gate evaluation', () => {
    const fixture = createFixture();

    const dashboard = buildDashboard({
        ...fixture,
        qualityGateEvaluation:
            fixture.qualityGateEvaluation
    });

    assert.equal(
        dashboard.qualityGate.status,
        'PASSED'
    );

    assert.equal(
        dashboard.qualityGate.summary.total,
        9
    );

    assert.equal(
        dashboard.qualityGate.results.length,
        2
    );
});


test('Dashboard includes individual gate explanations in Markdown', () => {
    const fixture = createFixture();

    const dashboard = buildDashboard({
        ...fixture,
        qualityGateEvaluation:
            fixture.qualityGateEvaluation
    });

    const markdown = renderMarkdown(dashboard);

    assert.ok(
        markdown.includes('Minimum Executed Test Count')
    );

    assert.ok(
        markdown.includes('Minimum Pass Rate')
    );

    assert.ok(
        markdown.includes('Pass rate is below the threshold.')
    );
});

// ---------- Summary ----------

console.log('\n--------------------------------');
console.log(`Quality Dashboard Tests: ${passed} passed`);
console.log('--------------------------------\n');