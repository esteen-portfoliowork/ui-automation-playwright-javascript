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

module.exports = {
    calculateTestStabilityIndex,
    calculateModuleHealthScore,
    getModuleHealthStatus
};