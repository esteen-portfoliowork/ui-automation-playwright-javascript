const fs = require('fs');

function readJson(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(
            `Required analytics source unavailable: ${filePath}`
        );
    }

    try {
        return JSON.parse(
            fs.readFileSync(filePath, 'utf8')
        );
    } catch (error) {
        throw new Error(
            `Invalid JSON in ${filePath}: ${error.message}`
        );
    }
}

const risk = readJson('risk-analysis.json');

const cases = [
    {
        label: 'Failed modules',
        file: 'failed-modules.md',
        data: risk.failedModules,
        emptyMessage: '✅ No failed modules found.',
        tableHeader: '| Application | Module | Failed Tests |'
    },
    {
        label: 'Failed tests',
        file: 'failed-tests.md',
        data: risk.failedTests,
        emptyMessage: '✅ No failed tests found.',
        tableHeader: '| Application | Module | Test Case | Project | Retries |'
    },
    {
        label: 'Flaky tests',
        file: 'flaky-tests.md',
        data: risk.flakyTests,
        emptyMessage: '✅ No flaky tests found.',
        tableHeader: '| Application | Module | Test Case | Project | Retries |'
    }
];

let failures = 0;

for (const item of cases) {
    if (!Array.isArray(item.data)) {
        console.error(
            `❌ ${item.label}: source data is invalid.`
        );

        failures++;
        continue;
    }

    if (!fs.existsSync(item.file)) {
        console.error(
            `❌ ${item.label}: report file is missing.`
        );

        failures++;
        continue;
    }

    const content = fs.readFileSync(
        item.file,
        'utf8'
    ).trim();

    if (!content) {
        console.error(
            `❌ ${item.label}: report file is empty.`
        );

        failures++;
        continue;
    }

    if (item.data.length === 0) {
        if (content !== item.emptyMessage) {
            console.error(
                `❌ ${item.label}: expected empty-state message is missing.`
            );

            failures++;
        } else {
            console.log(
                `✅ ${item.label}: valid empty-state message.`
            );
        }

        continue;
    }

    if (!content.includes(item.tableHeader)) {
        console.error(
            `❌ ${item.label}: expected populated table is missing.`
        );

        failures++;
    } else {
        console.log(
            `✅ ${item.label}: ${item.data.length} records validated.`
        );
    }
}

if (failures > 0) {
    throw new Error(
        `${failures} empty-state validation check(s) failed.`
    );
}

console.log(
    '✅ Empty-state validation completed successfully.'
);
