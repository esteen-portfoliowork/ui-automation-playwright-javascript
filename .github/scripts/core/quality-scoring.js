const STABILITY_CONFIG = {
    minimumRuns: 3,
    maximumRuns: 30
};

function calculateTestStabilityIndex(runs) {
    const validRuns = runs
        .filter(run =>
            Number(run.total) > 0 &&
            Number.isFinite(Number(run.flaky)) &&
            Number.isFinite(Number(run.passed)) &&
            Number.isFinite(Number(run.failed))
        )
        .slice(-STABILITY_CONFIG.maximumRuns);

    if (validRuns.length < STABILITY_CONFIG.minimumRuns) {
        return {
            available: false,
            score: null,
            status: 'UNKNOWN',
            reason: 'Insufficient historical execution data.',
            runsAnalyzed: validRuns.length
        };
    }

    const totalExecuted = validRuns.reduce(
        (sum, run) =>
            sum +
            Number(run.passed) +
            Number(run.failed) +
            Number(run.flaky),
        0
    );

    const totalFlaky = validRuns.reduce(
        (sum, run) => sum + Number(run.flaky),
        0
    );

    if (totalExecuted === 0) {
        return {
            available: false,
            score: null,
            status: 'UNKNOWN',
            reason: 'No executed tests found in history.',
            runsAnalyzed: validRuns.length
        };
    }

    const historicalFlakyRate =
        (totalFlaky / totalExecuted) * 100;

    const score = Math.round(
        Math.max(0, 100 - historicalFlakyRate)
    );

    let status = 'STABLE';

    if (score < 75) {
        status = 'UNSTABLE';
    } else if (score < 90) {
        status = 'NEEDS ATTENTION';
    }

    return {
        available: true,
        score,
        status,
        historicalFlakyRate: Number(
            historicalFlakyRate.toFixed(2)
        ),
        totalFlaky,
        totalExecuted,
        runsAnalyzed: validRuns.length
    };
}

function calculateModuleHealthScore(riskScore, executed) {
    if (
        !Number.isFinite(riskScore) ||
        !Number.isFinite(executed) ||
        executed <= 0
    ) {
        return null;
    }

    return Number(
        Math.max(0, Math.min(100, 100 - riskScore)).toFixed(2)
    );
}

function getModuleHealthStatus(score) {
    if (!Number.isFinite(score)) {
        return '⚪ Unknown';
    }

    if (score >= 90) return '🟢 Healthy';
    if (score >= 75) return '🔵 Good';
    if (score >= 50) return '🟡 Needs Attention';

    return '🔴 Critical';
}

function calculateReleaseQualityScore({
    executedTests,
    passRate,
    failureRate,
    flakyRate,
    testStabilityIndex,
    modules,
    averageTestDurationMs,
    weights,
    flakyRateThreshold,
    slowTestThresholdMs
}) {

    const isValidNumber = value =>
        value !== null &&
        value !== undefined &&
        Number.isFinite(Number(value));

    // ---------- Validate Required Metrics ----------

    if (
        !isValidNumber(executedTests) ||
        executedTests <= 0
    ) {
        return {
            available: false,
            qualityScore: null,
            reason: 'No executed tests are available.'
        };
    }

    if (
        !isValidNumber(passRate) ||
        !isValidNumber(failureRate) ||
        !isValidNumber(flakyRate)
    ) {
        return {
            available: false,
            qualityScore: null,
            reason: 'Required execution metrics are unavailable.'
        };
    }

    if (
        !isValidNumber(averageTestDurationMs) ||
        averageTestDurationMs <= 0
    ) {
        return {
            available: false,
            qualityScore: null,
            reason: 'Performance duration data is unavailable.'
        };
    }

    if (
        !Array.isArray(modules) ||
        modules.length === 0
    ) {
        return {
            available: false,
            qualityScore: null,
            reason: 'Module Health Score data is unavailable.'
        };
    }

    const validModuleHealthScores = modules
        .map(module => module.healthScore)
        .filter(isValidNumber)
        .map(Number);

    if (validModuleHealthScores.length === 0) {
        return {
            available: false,
            qualityScore: null,
            reason: 'No valid Module Health Scores are available.'
        };
    }

    // ---------- Validate Weights ----------

    const requiredWeightKeys = [
        'passRate',
        'failureRate',
        'flakyRate',
        'moduleRisk',
        'performance'
    ];

    if (
        !weights ||
        typeof weights !== 'object' ||
        Array.isArray(weights) ||
        requiredWeightKeys.some(key =>
            !isValidNumber(weights[key]) ||
            Number(weights[key]) < 0
        )
    ) {
        return {
            available: false,
            qualityScore: null,
            reason: 'Release Quality Score weights are missing or invalid.'
        };
    }

    if (
        !isValidNumber(flakyRateThreshold) ||
        Number(flakyRateThreshold) <= 0 ||
        !isValidNumber(slowTestThresholdMs) ||
        Number(slowTestThresholdMs) <= 0
    ) {
        return {
            available: false,
            qualityScore: null,
            reason: 'Release Quality Score thresholds are missing or invalid.'
        };
    }

    const totalWeight = requiredWeightKeys.reduce(
        (sum, key) => sum + Number(weights[key]),
        0
    );

    if (
        !Number.isFinite(totalWeight) ||
        totalWeight !== 100
    ) {
        return {
            available: false,
            qualityScore: null,
            reason: 'Release Quality Score weights must total 100%.'
        };
    }

    // ---------- Component Quality Scores ----------

    const passRateQuality = Number(passRate);

    const failureRateQuality = Math.max(
        0,
        100 - Number(failureRate)
    );

    const currentFlakyQuality = Math.max(
        0,
        100 - (
            Number(flakyRate) /
            flakyRateThreshold
        ) * 100
    );

    // Use historical stability when available.
    // Otherwise, use the current execution's flaky quality.

    const stabilityAvailable =
        testStabilityIndex?.available === true &&
        isValidNumber(testStabilityIndex.score);

    const flakyRateQuality = stabilityAvailable
        ? (
            currentFlakyQuality +
            Number(testStabilityIndex.score)
        ) / 2
        : currentFlakyQuality;

    // Use the weakest module's health score.
    const moduleHealthQuality = Math.min(
        ...validModuleHealthScores
    );

    const performanceQuality = Math.max(
        0,
        100 - (
            Number(averageTestDurationMs) /
            slowTestThresholdMs
        ) * 100
    );

    const componentQualityScores = {
        passRate: passRateQuality,
        failureRate: failureRateQuality,
        flakyRate: flakyRateQuality,
        moduleHealth: moduleHealthQuality,
        performance: performanceQuality
    };

    // ---------- Weighted Component Scores ----------

    const componentScores = {
        passRate:
            passRateQuality * weights.passRate / 100,

        failureRate:
            failureRateQuality * weights.failureRate / 100,

        flakyRate:
            flakyRateQuality * weights.flakyRate / 100,

        moduleHealth:
            moduleHealthQuality * weights.moduleRisk / 100,

        performance:
            performanceQuality * weights.performance / 100
    };

    // ---------- Final Release Quality Score ----------

    const qualityScore = Number(
        Object.values(componentScores)
            .reduce((sum, score) => sum + score, 0)
            .toFixed(2)
    );

    return {
        available: true,

        qualityScore,

        componentQualityScores: Object.fromEntries(
            Object.entries(componentQualityScores)
                .map(([key, value]) => [
                    key,
                    Number(value.toFixed(2))
                ])
        ),

        componentScores: Object.fromEntries(
            Object.entries(componentScores)
                .map(([key, value]) => [
                    key,
                    Number(value.toFixed(2))
                ])
        ),

        stabilityIntegration: {
            available: stabilityAvailable,
            method: stabilityAvailable
                ? '50% current flaky quality + 50% historical Test Stability Index'
                : 'Current flaky quality only'
        },

        moduleHealthIntegration: {
            method: 'Lowest Module Health Score',
            modulesAnalyzed: validModuleHealthScores.length,
            lowestModuleHealthScore: Number(
                moduleHealthQuality.toFixed(2)
            )
        }
    };
}

module.exports = {
    calculateTestStabilityIndex,
    calculateModuleHealthScore,
    getModuleHealthStatus,
    calculateReleaseQualityScore
};