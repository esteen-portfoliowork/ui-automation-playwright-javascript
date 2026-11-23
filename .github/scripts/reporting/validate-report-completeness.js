
// ---------- Reporting Completeness Validation ----------

const fs = require('fs');

const requiredJsonFiles = [
    'analytics.json',
    'risk-analysis.json',
    'historical-trend.json',
    'release-readiness.json'
];

const requiredMarkdownFiles = [
    'release-readiness.md',
    'application-health-dashboard.md',
    'module-breakdown.md',
    'tag-execution-summary.md',
    'top-risk-modules.md',
    'failed-modules.md',
    'failed-tests.md',
    'flaky-tests.md',
    'slowest-module.md',
    'historical-test-trend.md',
    'report-links.md'
];

const failures = [];

function validateJsonFile(file) {
    if (!fs.existsSync(file)) {
        failures.push(`Missing JSON report: ${file}`);
        console.error(`❌ Missing: ${file}`);
        return;
    }

    try {
        const data = JSON.parse(
            fs.readFileSync(file, 'utf8')
        );

        if (
            !data ||
            typeof data !== 'object' ||
            Array.isArray(data)
        ) {
            throw new Error('Invalid JSON structure.');
        }

        console.log(`✅ Valid JSON: ${file}`);
    } catch (error) {
        failures.push(`Invalid JSON report: ${file}`);
        console.error(
            `❌ Invalid: ${file} — ${error.message}`
        );
    }
}

function validateMarkdownFile(file) {
    if (!fs.existsSync(file)) {
        failures.push(`Missing Markdown report: ${file}`);
        console.error(`❌ Missing: ${file}`);
        return;
    }

    const content = fs.readFileSync(
        file,
        'utf8'
    ).trim();

    if (!content) {
        failures.push(`Empty Markdown report: ${file}`);
        console.error(`❌ Empty: ${file}`);
        return;
    }

    const unavailableMarkers = [
        '_Report unavailable:',
        '⚪ Report data unavailable:'
    ];

    const hasUnavailableMarker = unavailableMarkers.some(
        marker => content.includes(marker)
    );

    if (hasUnavailableMarker) {
        failures.push(
            `Unavailable report placeholder: ${file}`
        );

        console.error(
            `❌ Unavailable placeholder: ${file}`
        );

        return;
    }

    console.log(`✅ Valid Markdown: ${file}`);
}

console.log('🔍 Reporting Completeness Validation');
console.log('-------------------------------------');

for (const file of requiredJsonFiles) {
    validateJsonFile(file);
}

for (const file of requiredMarkdownFiles) {
    validateMarkdownFile(file);
}

console.log('-------------------------------------');

if (failures.length > 0) {
    console.error(
        `❌ Reporting completeness failed: ${failures.length} issue(s).`
    );

    for (const failure of failures) {
        console.error(`- ${failure}`);
    }

    process.exitCode = 1;
} else {
    console.log(
        '✅ All required reporting outputs are available.'
    );
}

// ---------- ----------