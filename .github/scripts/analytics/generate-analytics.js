const fs = require('fs');

const reportPath = 'playwright-report/results.json';

if (!fs.existsSync(reportPath)) {
  console.log('results.json not found');

  fs.writeFileSync(
    'analytics.json',
    JSON.stringify(
      {
        execution: {},
        applications: [],
        modules: [],
        tags: [],
        failedTests: [],
        flakyTests: []
      },
      null,
      2
    )
  );

  process.exit(0);
}

const report = JSON.parse(
  fs.readFileSync(reportPath, 'utf8')
);

const analytics = {
  execution: {},
  applications: [],
  modules: [],
  tags: [],
  failedTests: [],
  flakyTests: [],
  generatedAt: new Date().toISOString()
};

const APPLICATIONS = {
  'expand-testing': 'Expand Testing',
  'orange-hrm': 'Orange HRM',
  'qa-playground': 'QA Playground',
  'sauce-demo': 'SauceDemo'
};

const {
  calculateMetrics
} = require('./metrics');

const applications = {};

const modules = {};

const tags = {};

// analytics.modules.push({
//   application,
//   module,
//   total,
//   passed,
//   failed,
//   flaky,
//   skipped,
//   passRate,
//   failRate,
//   flakyRate,
//   skippedRate,
//   qualityScore,
//   health
// });

function walkSuites(suites, parentFile = '') {
  for (const suite of suites || []) {
    const file = suite.file || parentFile;

    for (const spec of suite.specs || []) {

      const specFile = file || 'Unknown';
      const parts = specFile.split('/');

      const applicationKey = parts[0] || 'Unknown';
      const moduleKey =
        (parts[1] || 'Unknown')
          .replace('.spec.js', '')
          .replace('.spec.ts', '');

      const application =
        getApplicationName(applicationKey);

      const key =
        `${application}::${moduleKey}`;

      const tests = spec.tests || [];

      const isFailed =
        spec.ok === false;

      const isFlaky =
        tests.some(
          test => test.status === 'flaky'
        );

      const isSkipped =
        tests.length > 0 &&
        tests.every(test =>
          (test.results || []).every(
            result => result.status === 'skipped'
          )
        );

      const isPassed =
        spec.ok === true &&
        !isFlaky;

function getApplicationName(app) {
  return APPLICATIONS[app] || app;
}

fs.writeFileSync(
  'analytics.json',
  JSON.stringify(
    analytics,
    null,
    2
  )
);

console.log('analytics.json generated');