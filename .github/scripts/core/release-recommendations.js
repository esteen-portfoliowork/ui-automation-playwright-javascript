const DEFAULT_CONFIG = Object.freeze({
    releaseQuality: {
        go: 90,
        conditionalGo: 75
    },

    testStability: {
        go: 90,
        conditionalGo: 75
    },

    moduleHealth: {
        go: 90,
        conditionalGo: 75,
        critical: 50
    },

    failureRate: {
        maximum: 5
    }
});

const RECOMMENDATIONS = Object.freeze({
    GO: 'GO',
    CONDITIONAL_GO: 'CONDITIONAL GO',
    NO_GO: 'NO-GO',
    REVIEW_REQUIRED: 'REVIEW REQUIRED'
});

function isValidScore(value) {
    return (
        value !== null &&
        value !== undefined &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0 &&
        Number(value) <= 100
    );
}

function createRecommendation({
    recommendation,
    reasons,
    actions,
    metrics,
    evaluatedAt,
    qualityGate
}) {
    return {
        recommendation,
        explanation: reasons.length
            ? reasons.join(' ')
            : 'All configured release requirements are satisfied.',

        reasons,
        actions,

        metrics,

        qualityGate,

        evaluatedAt
    };
}

function generateReleaseRecommendation(
    input,
    config = DEFAULT_CONFIG
) {
    const reasons = [];
    const actions = [];

    const evaluatedAt = new Date().toISOString();

    const releaseQuality = input?.releaseQuality;
    const testStability = input?.testStability;
    const modules = input?.modules;
    const execution = input?.execution;
    const qualityGate = input?.qualityGate || {
        configured: false,
        status: 'NOT_CONFIGURED'
    };

    // ---------- Validate Required Data ----------

    if (
        !releaseQuality ||
        releaseQuality.available !== true ||
        !isValidScore(releaseQuality.qualityScore)
    ) {
        reasons.push(
            'Release Quality Score is unavailable or invalid.'
        );

        actions.push(
            'Generate a valid Release Quality Score before making a release decision.'
        );
    }

    if (
        !testStability ||
        testStability.available !== true ||
        !isValidScore(testStability.score)
    ) {
        reasons.push(
            'Test Stability Index is unavailable or insufficient.'
        );

        actions.push(
            'Collect sufficient historical execution data to calculate the Test Stability Index.'
        );
    }

    if (
        !execution ||
        !Number.isFinite(execution.executedTests) ||
        execution.executedTests <= 0 ||
        !Number.isFinite(execution.failedTests) ||
        !Number.isFinite(execution.failureRate)
    ) {
        reasons.push(
            'Execution results are missing or insufficient.'
        );

        actions.push(
            'Validate test execution results and regenerate the execution analytics.'
        );
    }

    if (
        !Array.isArray(modules) ||
        modules.length === 0 ||
        !modules.some(module =>
            isValidScore(module.healthScore)
        )
    ) {
        reasons.push(
            'Module Health Score data is unavailable.'
        );

        actions.push(
            'Generate Module Health Scores for the analyzed modules.'
        );
    }

    if (
        qualityGate.configured === true &&
        !['PASSED', 'FAILED', 'WARNING'].includes(
            qualityGate.status
        )
    ) {
        reasons.push(
            'Quality Gate is configured but its evaluation result is unavailable.'
        );

        actions.push(
            'Run the configured Quality Gate evaluation and publish its result.'
        );
    }

    const metrics = {
        releaseQualityScore:
            releaseQuality?.qualityScore ?? null,

        testStabilityIndex:
            testStability?.score ?? null,

        executedTests:
            execution?.executedTests ?? null,

        failedTests:
            execution?.failedTests ?? null,

        failureRate:
            execution?.failureRate ?? null,

        lowestModuleHealthScore: null,

        criticalModuleCount: null
    };

    // REVIEW REQUIRED takes precedence when required
    // data is unavailable. Do not interpret missing
    // information as a successful release.

    if (reasons.length > 0) {
        return createRecommendation({
            recommendation: RECOMMENDATIONS.REVIEW_REQUIRED,
            reasons,
            actions,
            metrics,
            evaluatedAt,
            qualityGate
        });
    }

    // ---------- Module Analysis ----------

    const validModules = modules.filter(
        module => isValidScore(module.healthScore)
    );

    const lowestModuleHealthScore = Math.min(
        ...validModules.map(module =>
            Number(module.healthScore)
        )
    );

    const criticalModules = validModules.filter(
        module =>
            Number(module.healthScore) <
                config.moduleHealth.critical ||
            String(module.riskLevel || '').toLowerCase() === 'critical'
    );

    metrics.lowestModuleHealthScore =
        lowestModuleHealthScore;

    metrics.criticalModuleCount =
        criticalModules.length;

    // ---------- Hard-Stop Conditions ----------

    const failedTests = execution.failedTests;

    if (failedTests > 0) {
        reasons.push(
            `${failedTests} failed test(s) were detected.`
        );

        actions.push(
            'Investigate and resolve failed tests before approving the release.'
        );
    }

    if (execution.failureRate > config.failureRate.maximum) {
        reasons.push(
            `Failure rate (${execution.failureRate}%) exceeds the ${config.failureRate.maximum}% threshold.`
        );

        actions.push(
            'Reduce the test failure rate to within the configured release threshold.'
        );
    }

    if (criticalModules.length > 0) {
        const names = criticalModules.map(module =>
            `${module.application} / ${module.module}`
        );

        reasons.push(
            `Critical module health detected: ${names.join(', ')}.`
        );

        actions.push(
            'Investigate critical modules and improve their Module Health Scores before release.'
        );
    }

    if (
        qualityGate.configured === true &&
        qualityGate.status === 'FAILED'
    ) {
        reasons.push(
            'One or more Quality Gates failed.'
        );

        actions.push(
            'Resolve failed Quality Gate conditions before release.'
        );
    }

    if (reasons.length > 0) {
        return createRecommendation({
            recommendation: RECOMMENDATIONS.NO_GO,
            reasons,
            actions,
            metrics,
            evaluatedAt,
            qualityGate
        });
    }

    // ---------- Quality Evaluation ----------

    const concerns = [];

    if (
        releaseQuality.qualityScore <
        config.releaseQuality.go
    ) {
        concerns.push(
            `Release Quality Score is ${releaseQuality.qualityScore}, below the GO threshold of ${config.releaseQuality.go}.`
        );

        actions.push(
            'Improve the lowest-scoring Release Quality components.'
        );
    }

    if (
        testStability.score <
        config.testStability.go
    ) {
        concerns.push(
            `Test Stability Index is ${testStability.score}, below the GO threshold of ${config.testStability.go}.`
        );

        actions.push(
            'Investigate flaky tests and improve execution stability.'
        );
    }

    if (
        lowestModuleHealthScore <
        config.moduleHealth.go
    ) {
        concerns.push(
            `Lowest Module Health Score is ${lowestModuleHealthScore}, below the GO threshold of ${config.moduleHealth.go}.`
        );

        actions.push(
            'Prioritize remediation of modules with reduced health scores.'
        );
    }

    if (
        qualityGate.configured === true &&
        qualityGate.status === 'WARNING'
    ) {
        concerns.push(
            'Quality Gate evaluation completed with warnings.'
        );

        actions.push(
            'Review Quality Gate warnings and document accepted exceptions.'
        );
    }

    // ---------- Final Recommendation ----------

    const score = releaseQuality.qualityScore;

    const minimumConditionalScore =
        config.releaseQuality.conditionalGo;

    if (score < minimumConditionalScore) {
        concerns.push(
            `Release Quality Score (${score}) is below the minimum conditional release threshold of ${minimumConditionalScore}.`
        );

        actions.push(
            'Address the release quality deficiencies and execute validation again.'
        );

        return createRecommendation({
            recommendation: RECOMMENDATIONS.NO_GO,
            reasons: concerns,
            actions,
            metrics,
            evaluatedAt,
            qualityGate
        });
    }

    if (concerns.length > 0) {
        return createRecommendation({
            recommendation: RECOMMENDATIONS.CONDITIONAL_GO,
            reasons: concerns,
            actions,
            metrics,
            evaluatedAt,
            qualityGate
        });
    }

    return createRecommendation({
        recommendation: RECOMMENDATIONS.GO,
        reasons: [
            'Release Quality Score meets the GO threshold.',
            'Test Stability Index meets the GO threshold.',
            'All analyzed modules meet the Module Health threshold.',
            'No failed tests or critical modules were detected.',
            qualityGate.configured
                ? 'All configured Quality Gates passed.'
                : 'Quality Gates are not configured; no gate result was used.'
        ],
        actions: [
            'Complete the normal release approval process.',
            'Confirm that the release artifacts and deployment plan are ready.'
        ],
        metrics,
        evaluatedAt,
        qualityGate
    });
}

module.exports = {
    DEFAULT_CONFIG,
    RECOMMENDATIONS,
    generateReleaseRecommendation
};