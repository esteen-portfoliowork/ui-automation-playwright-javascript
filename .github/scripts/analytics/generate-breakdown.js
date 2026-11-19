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
    `${name}<<${delimiter}
${value}
${delimiter}
`
  );
}

// ------- Applications -------
const appLines = [
  '| Application | Total | Passed | Failed | Flaky | Skipped | Pass Rate | Fail Rate | Flaky Rate | Skipped Rate | Quality Score | Health |',
  '|:-------------:|:--------:|:--------:|:--------:|:--------:|:--------:|:-----------:|:-----------:|:------------:|:-----------:|:-----------:|:-----------:|'
];

for (const app of analytics.applications) {
  appLines.push(
    `| ${app.application} | ${app.total} | ${app.passed} | ${app.failed} | ${app.flaky} | ${app.skipped} | ${app.passRate}% | ${app.failRate}% | ${app.flakyRate}% | ${app.skippedRate}% | ${app.qualityScore}% | ${app.health} |`
  );
}

fs.writeFileSync(
  'application-health-dashboard.md',
  appLines.join('\n')
);

// ------- Modules -------
const moduleLines = [
  '| Application | Module | Total | Passed | Failed | Flaky | Skipped | Pass Rate | Fail Rate | Flaky Rate | Skipped Rate | Quality Score | Health |',
  '|:-------------:|:-------------:|:--------:|:--------:|:--------:|:--------:|:---------:|:-----------:|:-----------:|:------------:|:--------------:|:---------------:|:-----------:|'
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

const applicationHealthText =
  analytics.applications
    .map(app =>
      `• *${app.application}* — Total: ${app.total} | Passed: ${app.passed} | Failed: ${app.failed} | Flaky: ${app.flaky} | Skipped: ${app.skipped}`
    )
    .join('\n');

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
  'APPLICATION_HEALTH_TEXT',
  applicationHealthText
);

setOutput(
  'MODULE_BREAKDOWN_TEXT',
  moduleBreakdownText
);