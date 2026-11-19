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

fs.writeFileSync(
  'analytics.json',
  JSON.stringify(
    analytics,
    null,
    2
  )
);

console.log('analytics.json generated');