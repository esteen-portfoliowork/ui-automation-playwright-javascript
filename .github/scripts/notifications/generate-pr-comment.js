const fs = require('fs');

const data = JSON.parse(
  fs.readFileSync(
    'notification-data.json',
    'utf8'
  )
);

function read(path) {
  return fs.existsSync(path)
    ? fs.readFileSync(path, 'utf8')
    : 'N/A';
}

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

fs.writeFileSync(
  'pr-comment.md',
  comment
);