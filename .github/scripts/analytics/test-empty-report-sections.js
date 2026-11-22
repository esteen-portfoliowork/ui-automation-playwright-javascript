
const fs = require('fs');

const cases = [
    {
        file: 'failed-modules.md',
        message: 'No failed modules found.'
    },
    {
        file: 'failed-tests.md',
        message: 'No failed tests found.'
    },
    {
        file: 'flaky-tests.md',
        message: 'No flaky tests found.'
    }
];

let failures = 0;

for (const item of cases) {
    if (!fs.existsSync(item.file)) {
        console.error(`❌ Missing file: ${item.file}`);
        failures++;
        continue;
    }

    const content = fs.readFileSync(
        item.file,
        'utf8'
    ).trim();

    if (content === item.message) {
        console.log(`✅ ${item.file}: empty-state message verified.`);
    } else {
        console.log(
            `ℹ️ ${item.file}: contains actual report data or a different state.`
        );
    }
}

if (failures > 0) {
    process.exitCode = 1;
} else {
    console.log('Empty report section checks completed.');
}