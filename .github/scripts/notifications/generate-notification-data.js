// Provider-neutral data contract
// Common data contract between reporting system and all notification destinations
const fs = require('fs');

const data = {
  // Collect execution information
  slackChannel: process.env.SLACK_CHANNEL,

  buildEmoji: process.env.BUILD_EMOJI,
  buildText: process.env.BUILD_TEXT,
  executionHealth: process.env.EXECUTION_HEALTH,

  browser: process.env.BROWSER,
  executedTag: process.env.EXECUTED_TAG,
  environment: process.env.ENVIRONMENT,

  playwrightVersion: process.env.PLAYWRIGHT_VERSION,
  nodeVersion: process.env.NODE_VERSION,
  runnerOs: process.env.RUNNER_OS_NAME,

  startDate: process.env.START_DATE,
  endDate: process.env.END_DATE,

  totalTests: process.env.TOTAL_TESTS,
  passedTests: process.env.PASSED_TESTS,
  failedTests: process.env.FAILED_TESTS,
  flakyTests: process.env.FLAKY_TESTS,
  skippedTests: process.env.SKIPPED_TESTS,

  passRate: process.env.PASS_RATE,
  failureRate: process.env.FAILURE_RATE,
  flakyRate: process.env.FLAKY_RATE,
  skippedRate: process.env.SKIPPED_RATE,

  qualityScore: process.env.QUALITY_SCORE,
  executionDuration: process.env.EXECUTION_DURATION,

  // Collect report content
  releaseReadiness:
    process.env.RELEASE_READINESS_TEXT,

  applicationHealth:
    process.env.APPLICATION_HEALTH_TEXT,

  moduleBreakdown:
    process.env.MODULE_BREAKDOWN_TEXT,

  tagExecution:
    process.env.TAG_EXECUTION_TEXT,

  topRiskModule:
    process.env.TOP_RISK_MODULE_TEXT,

  failedModule:
    process.env.FAILED_MODULE_TEXT,

  failedTest:
    process.env.FAILED_TEST_TEXT,

  flakyTest:
    process.env.FLAKY_TEST_TEXT,

  slowestModule:
    process.env.SLOWEST_MODULE_TEXT,

  // Collect pull request information
  pr: {
    number: process.env.PR_NUMBER,
    title: process.env.PR_TITLE,
    url: process.env.PR_URL,
    author: process.env.PR_AUTHOR,
    branch: process.env.PR_BRANCH,
    baseBranch: process.env.PR_BASE_BRANCH,
    labels: process.env.PR_LABELS,
    sha: process.env.PR_SHA
  }
};

// generate notification-data.json
fs.writeFileSync(
  'notification-data.json',
  JSON.stringify(data, null, 2)
);