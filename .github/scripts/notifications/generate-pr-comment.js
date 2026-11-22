const fs = require('fs');

const REPORT_FILE = 'execution-summary.md';
const OUTPUT_FILE = 'pr-comment.md';

const MARKER = '<!-- playwright-validation-report -->';

// ---------- Validate Master Report ----------

if (!fs.existsSync(REPORT_FILE)) {
    throw new Error(
        `Master execution report not found: ${REPORT_FILE}`
    );
}

const report = fs.readFileSync(
    REPORT_FILE,
    'utf8'
).trim();

if (!report) {
    throw new Error(
        'Master execution report is empty.'
    );
}

// ---------- Generate PR Comment ----------

const comment = [
    MARKER,
    '',
    report
].join('\n');

// ---------- Save PR Comment ----------

fs.writeFileSync(
    OUTPUT_FILE,
    comment + '\n',
    'utf8'
);

console.log(
    'PR comment generated from the master execution report.'
);

console.log(
    `Output: ${OUTPUT_FILE}`
);