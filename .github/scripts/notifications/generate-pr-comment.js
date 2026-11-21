// 	Imports fs
const fs = require('fs');

// Reads and parses notification-data.json
const data = JSON.parse(
  fs.readFileSync(
    'notification-data.json',
    'utf8'
  )
);

// Defines read() to load Markdown reports, or return N/A if missing
function read(path) {
  return fs.existsSync(path)
    ? fs.readFileSync(path, 'utf8')
    : 'N/A';
}

// Builds the PR comment using a Markdown template
const comment = `
<!-- playwright-validation-report -->

# 🎭 Playwright Execution Summary

## ${data.buildEmoji} Pull Request Validation

${data.buildText}

## ❤️ Execution Health

${data.executionHealth}

Executed ${data.totalTests} automated tests with a pass rate of ${data.passRate}% in ${data.executionDuration}.

## 🖥️ Application Health

${read('application-health-dashboard.md')}

## 📦 Module Breakdown

${read('module-breakdown.md')}

## 🏷️ Test Tag Analytics

${read('tag-execution-summary.md')}
`;

// Writes the result to pr-comment.md
fs.writeFileSync(
  'pr-comment.md',
  comment
);