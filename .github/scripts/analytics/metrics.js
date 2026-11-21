// Shared calculations
// Calculate metrics consistently so that other scripts don't each implement their own formulas

// ---------- getHealth() ----------
// getHealth: determine execution health (assign health status based on failed and flaky test counts)
function getHealth(failed, flaky) {
  if (failed > 0) {
    return '🔴 Critical';
  }

  if (flaky > 0) {
    return '🟡 Unstable';
  }

  return '🟢 Healthy';
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

  const safeTotal = total || 0;

  const passRate =
    safeTotal > 0
      ? ((passed + flaky) / safeTotal) * 100
      : 0;

  const failRate =
    safeTotal > 0
      ? (failed / safeTotal) * 100
      : 0;

  const flakyRate =
    safeTotal > 0
      ? (flaky / safeTotal) * 100
      : 0;

  const skippedRate =
    safeTotal > 0
      ? (skipped / safeTotal) * 100
      : 0;

  const qualityScore =
    safeTotal > 0
      ? ((passed + (flaky * 0.5)) / safeTotal) * 100
      : 0;

  return {
    passRate: Number(passRate.toFixed(2)),
    failRate: Number(failRate.toFixed(2)),
    flakyRate: Number(flakyRate.toFixed(2)),
    skippedRate: Number(skippedRate.toFixed(2)),
    qualityScore: Number(qualityScore.toFixed(0)),
    health: getHealth(failed, flaky)
  };
}
// ---------- ----------

module.exports = {
  getHealth,
  calculateMetrics
};