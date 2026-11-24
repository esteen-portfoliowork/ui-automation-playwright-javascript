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

const riskAnalysis = JSON.parse(
  fs.readFileSync(
    'risk-analysis.json',
    'utf8'
  )
);

const riskModules = riskAnalysis.modules || [];

// Import functions from report-utils.js
const {
    escapeMarkdown,
    writeMarkdown
} = require('../reporting/report-utils');

// ---------- Application Health ----------

// Find the highest-risk module for each application.
// The application's scores represent its highest-risk module.

const applicationRiskMap = {};

for (const module of riskModules) {
  const existing = applicationRiskMap[module.application];

  if (
    !existing ||
    module.riskScore > existing.riskScore
  ) {
    applicationRiskMap[module.application] = module;
  }
}

const applicationLines = [
  '| Application | Total | Passed | Failed | Flaky | Skipped | Pass Rate | Fail Rate | Flaky Rate | Skipped Rate | Quality Score | Module Risk Score | Module Health Score | Module Health Status |',
  '|:-------------:|:--------:|:--------:|:--------:|:--------:|:--------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|:------------------:|:-------------------:|:-------------------:|'
];

for (const app of analytics.applications) {
  const highestRiskModule =
    applicationRiskMap[app.application];

  const moduleRiskScore = highestRiskModule
    ? `${highestRiskModule.riskScore.toFixed(2)}%`
    : 'N/A';

  const moduleHealthScore =
    highestRiskModule?.healthScore !== null &&
    highestRiskModule?.healthScore !== undefined
      ? `${highestRiskModule.healthScore.toFixed(2)}%`
      : 'N/A';

  const moduleHealthStatus =
    highestRiskModule?.healthStatus || '⚪ Unknown';

  applicationLines.push(
    `| ${escapeMarkdown(app.application)} | ${app.total} | ${app.passed} | ${app.failed} | ${app.flaky} | ${app.skipped} | ${app.passRate}% | ${app.failRate}% | ${app.flakyRate}% | ${app.skippedRate}% | ${app.qualityScore}% | ${moduleRiskScore} | ${moduleHealthScore} | ${moduleHealthStatus} |`
  );
}

writeMarkdown(
  'application-health-dashboard.md',
  applicationLines.join('\n')
);

// ---------- ----------

// ---------- Module Breakdown ----------

const riskModuleMap = new Map(
    riskModules.map(module => [
        `${module.application}::${module.module}`,
        module
    ])
);

const moduleLines = [
    '| Application | Module | Total | Passed | Failed | Flaky | Skipped | Pass Rate | Fail Rate | Flaky Rate | Skipped Rate | Quality Score | Module Risk Score | Module Health Score | Health Status |',
    '|:-------------:|:-------------:|:--------:|:--------:|:--------:|:--------:|:--------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|:----------------:|:-----------------:|:-------------:|'
];

for (const module of analytics.modules) {

    const riskModule = riskModuleMap.get(
        `${module.application}::${module.module}`
    );

    const moduleRiskScore = riskModule
        ? `${riskModule.riskScore.toFixed(2)}%`
        : 'N/A';

    const moduleHealthScore =
        riskModule?.healthScore !== null &&
        riskModule?.healthScore !== undefined
            ? `${riskModule.healthScore.toFixed(2)}%`
            : 'N/A';

    const healthStatus =
        riskModule?.healthStatus || '⚪ Unknown';

    moduleLines.push(
        `| ${escapeMarkdown(module.application)} | ${escapeMarkdown(module.module)} | ${module.total} | ${module.passed} | ${module.failed} | ${module.flaky} | ${module.skipped} | ${module.passRate}% | ${module.failRate}% | ${module.flakyRate}% | ${module.skippedRate}% | ${module.qualityScore}% | ${moduleRiskScore} | ${moduleHealthScore} | ${healthStatus} |`
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