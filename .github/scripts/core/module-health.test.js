
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    calculateModuleHealthScore,
    getModuleHealthStatus
} = require('./quality-scoring');

// Repository root: three levels above .github/scripts/core
const REPO_ROOT = path.resolve(__dirname, '../../..');

function getReportPath(file) {
    return path.join(REPO_ROOT, file);
}

function getJsonPath(file) {
    return getReportPath(file);
}

console.log('\n🏥 Module Health Scoring Tests\n');

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

// ---------- Health Score Calculation ----------

test('100 risk score produces 0 health score', () => {
    assert.equal(calculateModuleHealthScore(100, 10), 0);
});

test('0 risk score produces 100 health score', () => {
    assert.equal(calculateModuleHealthScore(0, 10), 100);
});

test('40 risk score produces 60 health score', () => {
    assert.equal(calculateModuleHealthScore(40, 10), 60);
});

test('Health score is rounded to two decimals', () => {
    assert.equal(calculateModuleHealthScore(12.345, 10), 87.66);
});

test('No executed tests returns null', () => {
    assert.equal(calculateModuleHealthScore(0, 0), null);
});

test('Invalid risk score returns null', () => {
    assert.equal(calculateModuleHealthScore(NaN, 10), null);
});

// ---------- Health Status Thresholds ----------

test('90 is Healthy', () => {
    assert.equal(getModuleHealthStatus(90), '🟢 Healthy');
});

test('100 is Healthy', () => {
    assert.equal(getModuleHealthStatus(100), '🟢 Healthy');
});

test('89.99 is Good', () => {
    assert.equal(getModuleHealthStatus(89.99), '🔵 Good');
});

test('75 is Good', () => {
    assert.equal(getModuleHealthStatus(75), '🔵 Good');
});

test('74.99 needs attention', () => {
    assert.equal(
        getModuleHealthStatus(74.99),
        '🟡 Needs Attention'
    );
});

test('50 needs attention', () => {
    assert.equal(
        getModuleHealthStatus(50),
        '🟡 Needs Attention'
    );
});

test('49.99 is Critical', () => {
    assert.equal(getModuleHealthStatus(49.99), '🔴 Critical');
});

test('0 is Critical', () => {
    assert.equal(getModuleHealthStatus(0), '🔴 Critical');
});

test('Null score is Unknown', () => {
    assert.equal(getModuleHealthStatus(null), '⚪ Unknown');
});

test('NaN score is Unknown', () => {
    assert.equal(getModuleHealthStatus(NaN), '⚪ Unknown');
});

// ---------- Generated Report Validation ----------

const reportFiles = [
    'top-risk-modules.md',
    'application-health-dashboard.md',
    'module-breakdown.md',
    'failed-modules.md',
    'slowest-module.md'
];

for (const file of reportFiles) {
    test(`${file} contains Module Health fields`, () => {
        const reportPath = getReportPath(file);

        assert.ok(
            fs.existsSync(reportPath),
            `${file} was not generated: ${reportPath}`
        );

        const content = fs.readFileSync(reportPath, 'utf8');

        assert.match(
            content,
            /Module Health Score/i,
            `${file} is missing Module Health Score`
        );

        assert.match(
            content,
            /Health Status/i,
            `${file} is missing Health Status`
        );
    });
}

// ---------- Risk JSON Validation ----------

test('risk-analysis.json contains health metrics', () => {
    const file = getJsonPath('risk-analysis.json');

    assert.ok(
        fs.existsSync(file),
        'risk-analysis.json was not generated'
    );

    const risk = JSON.parse(
        fs.readFileSync(file, 'utf8')
    );

    assert.ok(
        Array.isArray(risk.modules),
        'risk-analysis.json must contain a modules array'
    );

    for (const module of risk.modules) {
        assert.ok(
            Object.prototype.hasOwnProperty.call(
                module,
                'healthScore'
            ),
            `${module.application}/${module.module} is missing healthScore`
        );

        assert.ok(
            Object.prototype.hasOwnProperty.call(
                module,
                'healthStatus'
            ),
            `${module.application}/${module.module} is missing healthStatus`
        );

        if (module.executed === 0) {
            assert.equal(module.healthScore, null);
            assert.equal(module.healthStatus, '⚪ Unknown');
        }
    }
});

// ---------- Notification Data Validation ----------

test('notification-data.json contains module health metrics', () => {
    const file = getJsonPath('notification-data.json');

    assert.ok(
        fs.existsSync(file),
        'notification-data.json was not generated'
    );

    const notification = JSON.parse(
        fs.readFileSync(file, 'utf8')
    );

    assert.ok(
        notification.risk,
        'notification-data.json is missing risk data'
    );

    assert.ok(
        Array.isArray(notification.risk.modules),
        'notification-data.json must contain risk.modules'
    );

    for (const module of notification.risk.modules) {
        assert.ok(
            Object.prototype.hasOwnProperty.call(
                module,
                'healthScore'
            )
        );

        assert.ok(
            Object.prototype.hasOwnProperty.call(
                module,
                'healthStatus'
            )
        );
    }
});

console.log('\n--------------------------------');
console.log(`Module Health Tests: ${passed} passed`);
console.log('--------------------------------\n');
