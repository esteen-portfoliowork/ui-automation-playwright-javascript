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

function getApplicationName(app) {
  return APPLICATIONS[app] || app;
}

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

      const untaggedTests = [];

      const EXCLUDED_TAGS = [
        'sauce-demo',
        'orange-hrm'
      ];

      const specTags = [
        ...(spec.tags || []),
        ...tests.flatMap(test => test.tags || [])
      ]
        .map(tag => String(tag).replace(/^@/, '').toLowerCase())
        .filter(Boolean)
        .filter(tag => !EXCLUDED_TAGS.includes(tag));

      if (specTags.length === 0) {
        untaggedTests.push({
          title: spec.title,
          file: specFile
        });
      }

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

      // Application Aggregation
      if (!applications[application]) {
        applications[application] = {
          application,
          total: 0,
          passed: 0,
          failed: 0,
          flaky: 0,
          skipped: 0
        };
      }

      applications[application].total++;

      if (isPassed)
        applications[application].passed++;

      if (isFailed)
        applications[application].failed++;

      if (isFlaky)
        applications[application].flaky++;

      if (isSkipped)
        applications[application].skipped++;

      // Module Aggregation
      if (!modules[key]) {
        modules[key] = {
          application,
          module: moduleKey,
          total: 0,
          passed: 0,
          failed: 0,
          flaky: 0,
          skipped: 0
        };
      }

      modules[key].total++;

      if (isPassed)
        modules[key].passed++;

      if (isFailed)
        modules[key].failed++;

      if (isFlaky)
        modules[key].flaky++;

      if (isSkipped)
        modules[key].skipped++;

    // Tag Aggregation
    for (const tag of [...new Set(specTags)]) {

      if (!tags[tag]) {
        tags[tag] = {
          tag,
          total: 0,
          passed: 0,
          failed: 0,
          flaky: 0,
          skipped: 0
        };
      }

      tags[tag].total++;

      if (isPassed)
        tags[tag].passed++;

      if (isFailed)
        tags[tag].failed++;

      if (isFlaky)
        tags[tag].flaky++;

      if (isSkipped)
        tags[tag].skipped++;
    }

    }
    walkSuites(
      suite.suites,
      file
    );
  }
}

walkSuites(report.suites || []);

analytics.applications =
  Object.values(applications)
    .map(item => ({
      ...item,
      ...calculateMetrics(
        item.total,
        item.passed,
        item.failed,
        item.flaky,
        item.skipped
      )
    }));

analytics.modules =
  Object.values(modules)
    .map(item => ({
      ...item,
      ...calculateMetrics(
        item.total,
        item.passed,
        item.failed,
        item.flaky,
        item.skipped
      )
    }));

analytics.tags =
  Object.values(tags)
    .map(item => ({
      ...item,
      ...calculateMetrics(
        item.total,
        item.passed,
        item.failed,
        item.flaky,
        item.skipped
      )
    }));

analytics.untaggedTests = untaggedTests;

analytics.execution = {
  totalApplications:
    analytics.applications.length,

  totalModules:
    analytics.modules.length
};


fs.writeFileSync(
  'analytics.json',
  JSON.stringify(
    analytics,
    null,
    2
  )
);

console.log('analytics.json generated');