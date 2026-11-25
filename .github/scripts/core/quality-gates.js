const VALID_STATUSES = [
    'PASSED',
    'FAILED',
    'UNAVAILABLE',
    'SKIPPED'
];

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

function createResult({
    id,
    name,
    actual,
    operator,
    expected,
    status,
    explanation
}) {
    return {
        id,
        name,
        actual,
        operator,
        expected,
        status,
        passed: status === 'PASSED',
        explanation
    };
}

function evaluateMinimum({
    id,
    name,
    actual,
    threshold
}) {
    const value = toNumber(actual);
    const expected = toNumber(threshold);

    if (value === null || expected === null) {
        return createResult({
            id,
            name,
            actual: value,
            operator: '>=',
            expected,
            status: 'UNAVAILABLE',
            explanation:
                `${name} cannot be evaluated because the metric or threshold is unavailable.`
        });
    }

    const passed = value >= expected;

    return createResult({
        id,
        name,
        actual: value,
        operator: '>=',
        expected,
        status: passed ? 'PASSED' : 'FAILED',
        explanation: passed
            ? `${name} (${value}) meets the minimum threshold (${expected}).`
            : `${name} (${value}) is below the minimum threshold (${expected}).`
    });
}

function evaluateMaximum({
    id,
    name,
    actual,
    threshold
}) {
    const value = toNumber(actual);
    const expected = toNumber(threshold);

    if (value === null || expected === null) {
        return createResult({
            id,
            name,
            actual: value,
            operator: '<=',
            expected,
            status: 'UNAVAILABLE',
            explanation:
                `${name} cannot be evaluated because the metric or threshold is unavailable.`
        });
    }

    const passed = value <= expected;

    return createResult({
        id,
        name,
        actual: value,
        operator: '<=',
        expected,
        status: passed ? 'PASSED' : 'FAILED',
        explanation: passed
            ? `${name} (${value}%) is within the maximum threshold (${expected}%).`
            : `${name} (${value}%) exceeds the maximum threshold (${expected}%).`
    });
}

function evaluateReportingData({
    requiredFiles,
    reportingFiles
}) {
    const files = Array.isArray(requiredFiles)
        ? requiredFiles
        : [];

    const fileResults = files.map(file => {
        const available =
            reportingFiles &&
            reportingFiles[file] === true;

        return {
            file,
            available: Boolean(available),
            status: available ? 'PASSED' : 'FAILED',
            explanation: available
                ? `${file} exists and contains valid JSON.`
                : `${file} is missing or contains invalid JSON.`
        };
    });

    const failedFiles = fileResults.filter(
        item => !item.available
    );

    return {
        id: 'requiredReportingData',
        name: 'Required Reporting Data',
        actual: fileResults.length - failedFiles.length,
        expected: files.length,
        operator: 'all available',
        status: failedFiles.length === 0
            ? 'PASSED'
            : 'FAILED',
        passed: failedFiles.length === 0,
        files: fileResults,
        explanation: failedFiles.length === 0
            ? 'All required reporting files are available.'
            : `Missing or invalid reporting files: ${failedFiles.map(item => item.file).join(', ')}.`
    };
}

function evaluateQualityGates({
    riskAnalysis,
    config,
    reportingFiles = {}
}) {
    if (!config || typeof config !== 'object') {
        throw new Error(
            'Quality Gate configuration is required.'
        );
    }

    if (config.enabled !== true) {
        return {
            configured: false,
            status: 'NOT_CONFIGURED',
            passed: false,
            results: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                unavailable: 0,
                skipped: 0
            },
            explanation: 'Quality Gates are disabled.'
        };
    }

    const analysis = riskAnalysis || {};

    const readiness =
        analysis.releaseReadiness || {};

    const metrics =
        readiness.metrics || {};

    const thresholds =
        config.thresholds || {};

    const results = [];

    function addMinimum(key, name, actual) {
        const gate = thresholds[key];

        if (!gate || gate.enabled !== true) {
            results.push(createResult({
                id: key,
                name,
                actual: toNumber(actual),
                operator: '>=',
                expected: gate?.value ?? null,
                status: 'SKIPPED',
                explanation: `${name} is disabled.`
            }));
            return;
        }

        results.push(evaluateMinimum({
            id: key,
            name,
            actual,
            threshold: gate.value
        }));
    }

    function addMaximum(key, name, actual) {
        const gate = thresholds[key];

        if (!gate || gate.enabled !== true) {
            results.push(createResult({
                id: key,
                name,
                actual: toNumber(actual),
                operator: '<=',
                expected: gate?.value ?? null,
                status: 'SKIPPED',
                explanation: `${name} is disabled.`
            }));
            return;
        }

        results.push(evaluateMaximum({
            id: key,
            name,
            actual,
            threshold: gate.value
        }));
    }

    // ---------- Execution Metrics ----------

    addMinimum(
        'minimumTestCount',
        'Minimum Executed Test Count',
        metrics.executedTests
    );

    addMinimum(
        'minimumPassRate',
        'Minimum Pass Rate',
        metrics.passRate
    );

    addMaximum(
        'maximumFailureRate',
        'Maximum Failure Rate',
        metrics.failureRate
    );

    addMaximum(
        'maximumFlakyRate',
        'Maximum Flaky Rate',
        metrics.flakyRate
    );

    // ---------- Test Stability Index ----------

    const stability =
        analysis.testStabilityIndex || {};

    addMinimum(
        'minimumTestStabilityIndex',
        'Minimum Test Stability Index',
        stability.available === true
            ? stability.score
            : null
    );

    // ---------- Module Health ----------

    const modules = Array.isArray(analysis.modules)
        ? analysis.modules
        : [];

    const validModuleScores = modules
        .map(module => toNumber(module.healthScore))
        .filter(score => score !== null);

    const lowestModuleHealthScore =
        validModuleScores.length > 0
            ? Math.min(...validModuleScores)
            : null;

    addMinimum(
        'minimumModuleHealthScore',
        'Minimum Module Health Score',
        lowestModuleHealthScore
    );

    // ---------- Release Quality Score ----------

    addMinimum(
        'minimumReleaseQualityScore',
        'Minimum Release Quality Score',
        readiness.available === true
            ? readiness.qualityScore ?? readiness.score
            : null
    );

    // ---------- Critical Module Restriction ----------

    const criticalConfig =
        thresholds.criticalModuleRestriction;

    if (
        !criticalConfig ||
        criticalConfig.enabled !== true
    ) {
        results.push(createResult({
            id: 'criticalModuleRestriction',
            name: 'Critical Module Restriction',
            actual: null,
            operator: 'no critical modules',
            expected: null,
            status: 'SKIPPED',
            explanation:
                'Critical Module Restriction is disabled.'
        }));
    } else if (modules.length === 0) {
        results.push(createResult({
            id: 'criticalModuleRestriction',
            name: 'Critical Module Restriction',
            actual: null,
            operator: 'no critical modules',
            expected: null,
            status: 'UNAVAILABLE',
            explanation:
                'Module data is unavailable; critical modules cannot be evaluated.'
        }));
    } else {
        const criticalModules = modules.filter(module => {
            const score = toNumber(module.healthScore);

            if (score === null) {
                return false;
            }

            return (
                score < 50 ||
                /critical/i.test(
                    String(module.healthStatus || '')
                )
            );
        });

        const allowed =
            criticalConfig.allowCriticalModules === true;

        const passed =
            allowed || criticalModules.length === 0;

        results.push(createResult({
            id: 'criticalModuleRestriction',
            name: 'Critical Module Restriction',
            actual: criticalModules.length,
            operator: allowed
                ? 'critical modules allowed'
                : '0 critical modules',
            expected: allowed ? 'Allowed' : 0,
            status: passed ? 'PASSED' : 'FAILED',
            explanation: passed
                ? allowed
                    ? 'Critical modules are permitted by configuration.'
                    : 'No Critical modules were detected.'
                : `Critical modules detected: ${criticalModules.map(module =>
                    `${module.application} / ${module.module}`
                ).join(', ')}.`
        }));
    }

    // ---------- Required Reporting Data ----------

    const reportingConfig =
        config.reportingData || {};

    if (reportingConfig.enabled !== true) {
        results.push(createResult({
            id: 'requiredReportingData',
            name: 'Required Reporting Data',
            actual: null,
            operator: 'all available',
            expected: null,
            status: 'SKIPPED',
            explanation: 'Reporting data validation is disabled.'
        }));
    } else {
        results.push(evaluateReportingData({
            requiredFiles: reportingConfig.requiredFiles,
            reportingFiles
        }));
    }

    // ---------- Summary ----------

    const count = status =>
        results.filter(result =>
            result.status === status
        ).length;

    const passed = count('PASSED');
    const failed = count('FAILED');
    const unavailable = count('UNAVAILABLE');
    const skipped = count('SKIPPED');

    const failOnUnavailable =
        config.policy?.failOnUnavailable !== false;

    const overallFailed =
        failed > 0 ||
        (failOnUnavailable && unavailable > 0);

    const status = overallFailed
        ? 'FAILED'
        : 'PASSED';

    return {
        schemaVersion: '1.0.0',
        configured: true,
        status,
        passed: status === 'PASSED',

        evaluatedAt: null,

        policy: {
            failOnUnavailable
        },

        summary: {
            total: results.length,
            passed,
            failed,
            unavailable,
            skipped
        },

        results,

        explanation: status === 'PASSED'
            ? 'All enabled Quality Gates passed.'
            : 'One or more Quality Gates failed or required metrics were unavailable.'
    };
}

module.exports = {
    evaluateQualityGates,
    evaluateMinimum,
    evaluateMaximum,
    evaluateReportingData,
    VALID_STATUSES
};