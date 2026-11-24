
const assert = require('node:assert/strict');

const {
    normalizePlaywrightResults
} = require('./test-data');

const mockReport = {
    suites: [
        {
            file: 'sauce-demo/filter.spec.js',
            specs: [
                {
                    title: 'Filter products',
                    tags: ['@regression'],
                    tests: [
                        {
                            title: 'Filter products by price',
                            projectName: 'chromium',
                            status: 'flaky',
                            tags: ['@filter'],
                            results: [
                                {
                                    status: 'failed',
                                    duration: 1000
                                },
                                {
                                    status: 'passed',
                                    duration: 800
                                }
                            ]
                        },
                        {
                            title: 'Filter products by name',
                            projectName: 'chromium',
                            status: 'expected',
                            results: [
                                {
                                    status: 'passed',
                                    duration: 500
                                }
                            ]
                        },
                        {
                            title: 'Filter unavailable products',
                            projectName: 'chromium',
                            status: 'unexpected',
                            results: [
                                {
                                    status: 'failed',
                                    duration: 700
                                }
                            ]
                        },
                        {
                            title: 'Filter with empty inventory',
                            projectName: 'chromium',
                            status: 'skipped',
                            results: [
                                {
                                    status: 'skipped',
                                    duration: 0
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

const tests = normalizePlaywrightResults(mockReport);

assert.equal(tests.length, 4);

assert.equal(tests[0].status, 'flaky');
assert.equal(tests[0].durationMs, 1800);
assert.equal(tests[0].retries, 1);

assert.equal(tests[1].status, 'passed');
assert.equal(tests[2].status, 'failed');
assert.equal(tests[3].status, 'skipped');

assert.equal(tests[0].application, 'SauceDemo');
assert.equal(tests[0].module, 'filter');

assert.deepEqual(
    tests[0].tags,
    ['regression', 'filter']
);

console.log('All normalized test-data tests passed.');
