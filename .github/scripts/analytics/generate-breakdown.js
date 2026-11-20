const fs = require('fs');

const analytics = JSON.parse(
  fs.readFileSync(
    'analytics.json',
    'utf8'
  )
);

function setOutput(name, value) {
  const delimiter = `EOF_${name}`;

  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `${name}<<${delimiter}\n${value}\n${delimiter}\n`
  );
}

// ------- Applications -------
const applicationLines = [
  '| Application | Total | Passed | Failed | Flaky | Skipped | Pass Rate | Fail Rate | Flaky Rate | Skipped Rate | Quality Score | Health |',
  '|:-------------:|:--------:|:--------:|:--------:|:--------:|:--------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|'
];

for (const app of analytics.applications) {
  applicationLines.push(
    `| ${app.application} | ${app.total} | ${app.passed} | ${app.failed} | ${app.flaky} | ${app.skipped} | ${app.passRate}% | ${app.failRate}% | ${app.flakyRate}% | ${app.skippedRate}% | ${app.qualityScore}% | ${app.health} |`
  );
}

fs.writeFileSync(
  'application-health-dashboard.md',
  applicationLines.join('\n')
);

const applicationHealthText =
  analytics.applications
    .map(app =>
      `• *${app.application}* — Total: ${app.total} | Passed: ${app.passed} | Failed: ${app.failed} | Flaky: ${app.flaky} | Skipped: ${app.skipped} | Passed Rate: ${app.passRate}% | Fail Rate: ${app.failRate}% | Flaky Rate: ${app.flakyRate}% | Skipped Rate: ${app.skippedRate}% | Quality Score: ${app.qualityScore}% | Health: ${app.health}`
    )
    .join('\n');

setOutput(
  'APPLICATION_HEALTH_TEXT',
  applicationHealthText
);

// ------- Modules -------
const moduleLines = [
  '| Application | Module | Total | Passed | Failed | Flaky | Skipped | Pass Rate | Fail Rate | Flaky Rate | Skipped Rate | Quality Score | Health |',
  '|:-------------:|:-------------:|:--------:|:--------:|:--------:|:--------:|:--------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|'
];

for (const module of analytics.modules) {

  moduleLines.push(
    `| ${module.application} | ${module.module} | ${module.total} | ${module.passed} | ${module.failed} | ${module.flaky} | ${module.skipped} | ${module.passRate}% | ${module.failRate}% | ${module.flakyRate}% | ${module.skippedRate}% | ${module.qualityScore}% | ${module.health} |`
  );
}

fs.writeFileSync(
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

const moduleBreakdownText =
  Object.entries(groupedModules)
    .map(([application, modules]) =>
      `🧩 *${application}*\n${modules.join('\n')}`
    )
    .join('\n\n');

setOutput(
  'MODULE_BREAKDOWN_TEXT',
  moduleBreakdownText
);

// ------- Tags -------
const tagLines = [
  '| Tag | Total | Passed | Failed | Flaky | Skipped | Pass Rate | Fail Rate | Flaky Rate | Skipped Rate | Quality Score | Health |',
  '|:-------------:|:--------:|:--------:|:--------:|:--------:|:--------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|'
];

for (const tag of analytics.tags) {
  tagLines.push(
    `| ${tag.tag} | ${tag.total} | ${tag.passed} | ${tag.failed} | ${tag.flaky} | ${tag.skipped} | ${tag.passRate}% | ${tag.failRate}% | ${tag.flakyRate}% | ${tag.skippedRate}% | ${tag.qualityScore}% | ${tag.health} |`
  );
}

fs.writeFileSync(
  'tag-execution-summary.md',
  tagLines.join('\n')
);

const tagExecutionText =
  analytics.tags
    .map(tag =>
      `• *@${tag.tag}* — Total: ${tag.total} | Passed: ${tag.passed} | Failed: ${tag.failed} | Flaky: ${tag.flaky} | Skipped: ${tag.skipped} | Passed Rate: ${tag.passRate} | Fail Rate: ${tag.failRate} | Flaky Rate: ${tag.flakyRate} | Skipped Rate: ${tag.skippedRate} | Quality Score: ${tag.qualityScore} | Health: ${tag.health}`
    )
    .join('\n');

const untaggedText =
  analytics.untaggedTests?.length
    ? analytics.untaggedTests
        .map((test, index) =>
          `${index + 1}. *${test.title}* — \`${test.file}\``
        )
        .join('\n')
    : 'All test cases have valid tags.';

const finalTagExecutionText = [
  tagExecutionText,
  '',
  `⚠️ *Test Cases Without Tags: ${analytics.untaggedTests?.length || 0}*`,
  untaggedText
].join('\n');

setOutput(
  'TAG_EXECUTION_TEXT',
  finalTagExecutionText
);