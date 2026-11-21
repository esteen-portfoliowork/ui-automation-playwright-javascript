// Read and normalize test results
const {
  readPlaywrightResults,
  normalizePlaywrightResults
} = require('../core/test-data');

const report = readPlaywrightResults(
  'playwright-report/results.json'
);

const tests = normalizePlaywrightResults(report);

console.log(tests);