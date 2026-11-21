// Shared calculations
// Calculate metrics consistently so that other scripts don't each implement their own formulas

// ---------- getHealth() ----------
// getHealth: determine execution health (assign health status based on failed and flaky test counts)
function getHealth(failed, flaky, total = 0) {
    if (total === 0) {
        return '⚪ Unknown';
    }

    if (failed > 0) {
        return '🔴 Critical';
    }

    if (flaky > 0) {
        return '🟡 Unstable';
    }

    return '🟢 Healthy';
}
// ---------- ----------

// ---------- validateMetricCounts() ----------
// validateMetricCounts: prevents invalid or inconsistent metric inputs 
function validateMetricCounts(
    total,
    passed,
    failed,
    flaky,
    skipped
) {
    const counts = {
        total,
        passed,
        failed,
        flaky,
        skipped
    };

    for (const [name, value] of Object.entries(counts)) {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(
                `Invalid metric count: ${name} must be a non-negative integer.`
            );
        }
    }

    const calculatedTotal =
        passed + failed + flaky + skipped;

    if (total !== calculatedTotal) {
        throw new Error(
            `Inconsistent test counts: total is ${total}, ` +
            `but status counts add up to ${calculatedTotal}.`
        );
    }
}
// ---------- ----------

// ---------- calculateMetrics() ----------
// calculateMetrics: calculate rates and quality score
// Metric	: Current formula
// Pass Rate : (passed + flaky) / total × 100
// Fail Rate	: failed / total × 100
// Flaky Rate	: flaky / total × 100
// Skipped Rate	: skipped / total × 100
// Quality Score	: (passed + flaky × 0.5) / total × 100
function calculateMetrics(
    total,
    passed,
    failed,
    flaky,
    skipped
) {
    validateMetricCounts(
        total,
        passed,
        failed,
        flaky,
        skipped
    );

    const passRate = total > 0
        ? ((passed + flaky) / total) * 100
        : 0;

    const failRate = total > 0
        ? (failed / total) * 100
        : 0;

    const flakyRate = total > 0
        ? (flaky / total) * 100
        : 0;

    const skippedRate = total > 0
        ? (skipped / total) * 100
        : 0;

    const qualityScore = total > 0
        ? ((passed + (flaky * 0.5)) / total) * 100
        : 0;

    return {
        passRate: Number(passRate.toFixed(2)),
        failRate: Number(failRate.toFixed(2)),
        flakyRate: Number(flakyRate.toFixed(2)),
        skippedRate: Number(skippedRate.toFixed(2)),
        qualityScore: Math.round(qualityScore),
        health: getHealth(failed, flaky, total)
    };
}
// ---------- ----------

module.exports = {
    getHealth,
    validateMetricCounts,
    calculateMetrics
};