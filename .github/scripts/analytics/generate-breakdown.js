// Markdown breakdown reports
// Reads analytics and creates report content

// Import fs
const fs = require('fs');

const analytics = JSON.parse(
  fs.readFileSync(
    'analytics.json',
    'utf8'
  )
);

// Import functions from report-utils.js
const {
    escapeMarkdown,
    writeMarkdown
} = require('../reporting/report-utils');

// ---------- Application Health ----------
const applicationLines = [
  '| Application | Total | Passed | Failed | Flaky | Skipped | Pass Rate | Fail Rate | Flaky Rate | Skipped Rate | Quality Score | Health |',
  '|:-------------:|:--------:|:--------:|:--------:|:--------:|:--------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|'
];

for (const app of analytics.applications) {
  applicationLines.push(
    `| ${app.application} | ${app.total} | ${app.passed} | ${app.failed} | ${app.flaky} | ${app.skipped} | ${app.passRate}% | ${app.failRate}% | ${app.flakyRate}% | ${app.skippedRate}% | ${app.qualityScore}% | ${app.health} |`
  );
}

writeMarkdown(
  'application-health-dashboard.md',
  applicationLines.join('\n')
);
// ---------- ----------

// ---------- Module Breakdown ----------
const moduleLines = [
  '| Application | Module | Total | Passed | Failed | Flaky | Skipped | Pass Rate | Fail Rate | Flaky Rate | Skipped Rate | Quality Score | Health |',
  '|:-------------:|:-------------:|:--------:|:--------:|:--------:|:--------:|:--------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|'
];

for (const module of analytics.modules) {

  moduleLines.push(
    `| ${module.application} | ${module.module} | ${module.total} | ${module.passed} | ${module.failed} | ${module.flaky} | ${module.skipped} | ${module.passRate}% | ${module.failRate}% | ${module.flakyRate}% | ${module.skippedRate}% | ${module.qualityScore}% | ${module.health} |`
  );
}

writeMarkdown(
  'module-breakdown.md',
  moduleLines.join('\n')
);

const groupedModules = {};

for (const module of analytics.modules) {

  if (!groupedModules[module.application]) {
    groupedModules[module.application] = [];
  }

  groupedModules[module.application].push(
    `   • *${module.module}* — Total: ${module.total} | Passed: ${module.passed} | Failed: ${module.failed} | Flaky: ${module.flaky}`
  );
}
// ---------- ----------

// ---------- Tag Execution Summary ----------
const tagLines = [
  '| Tag | Total | Passed | Failed | Flaky | Skipped | Pass Rate | Fail Rate | Flaky Rate | Skipped Rate | Quality Score | Health |',
  '|:-------------:|:--------:|:--------:|:--------:|:--------:|:--------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|'
];

for (const tag of analytics.tags) {
  tagLines.push(
    `| ${tag.tag} | ${tag.total} | ${tag.passed} | ${tag.failed} | ${tag.flaky} | ${tag.skipped} | ${tag.passRate}% | ${tag.failRate}% | ${tag.flakyRate}% | ${tag.skippedRate}% | ${tag.qualityScore}% | ${tag.health} |`
  );
}

writeMarkdown(
  'tag-execution-summary.md',
  tagLines.join('\n')
);
// ---------- ----------