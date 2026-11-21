// Historical analytics
// Compare the current test execution against a previous successful run
// Show whether your testing results are improving, declining, or staying the same
const fs = require('fs');

// ---------- read historical execution data ----------
const historyPath = 'history/previous-summary.json';

const history = JSON.parse(
    fs.existsSync(historyPath)
        ? fs.readFileSync(historyPath, 'utf8')
        : '{"runs":[]}'
);

const runs = Array.isArray(history.runs) 
    ? history.runs 
    : [];
// ---------- ----------

// ---------- collect current execution metrics ----------
const current = {
    total: Number(process.env.TOTAL_TESTS || 0),
    passed: Number(process.env.PASSED_TESTS || 0),
    failed: Number(process.env.FAILED_TESTS || 0),
    flaky: Number(process.env.FLAKY_TESTS || 0),
    skipped: Number(process.env.SKIPPED_TESTS || 0),
    passRate: Number(process.env.PASS_RATE || 0),
    failRate: Number(process.env.FAILURE_RATE || 0),
    flakyRate: Number(process.env.FLAKY_RATE || 0),
    duration: process.env.EXECUTION_DURATION || '0s'
};
// ---------- ----------

// ---------- durationToSeconds() ----------
// durationToSeconds: converts different duration formats into seconds
function durationToSeconds(value) {
    const input = String(value).trim();

    if (/^\d+(\.\d+)?$/.test(input)) {
        return Number(input);
    }

    const regex = /(\d+(?:\.\d+)?)\s*(h|hr|hrs|m|min|mins|s|sec|secs)/gi;
    let match;
    let total = 0;

    while ((match = regex.exec(input)) !== null) {
        const amount = Number(match[1]);
        const unit = match[2].toLowerCase();

        if (unit.startsWith('h')) 
            total += amount * 3600;
        else if (unit.startsWith('m')) 
            total += amount * 60;
        else 
            total += amount;
    }

    return total;
}
// ---------- ----------

// ---------- formatDuration() ----------
// formatDuration: converts seconds back into a readable duration
function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) return 'N/A';

    const rounded = Math.round(seconds);
    const hours = Math.floor(rounded / 3600);
    const minutes = Math.floor((rounded % 3600) / 60);
    const secs = rounded % 60;

    if (hours > 0) 
        return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) 
        return `${minutes}m ${secs}s`;
    return `${secs}s`;
}
// ---------- ----------

// ---------- relativeChange() ----------
// relativeChange: calculates percentage changes for test-case count and execution duration
function relativeChange(currentValue, previousValue, lowerIsBetter = false) {
    if (!Number.isFinite(previousValue) || previousValue === 0) {
        return { text: 'N/A', favorable: null };
    }

    const change =
        ((currentValue - previousValue) / Math.abs(previousValue)) * 100;

    const sign = change > 0 ? '+' : '';
    const favorable = lowerIsBetter ? change < 0 : change > 0;

    return {
        text: `${sign}${change.toFixed(2)}%`,
        favorable: change === 0 ? null : favorable
    };
}
// ---------- ----------

// ---------- percentagePointChange() ----------
// percentagePointChange: calculates changes in rates
function percentagePointChange(currentValue, previousValue, lowerIsBetter = false) {
    if (!Number.isFinite(previousValue)) {
        return { text: 'N/A', favorable: null };
    }

    const change = currentValue - previousValue;
    const sign = change > 0 ? '+' : '';
    const favorable = lowerIsBetter ? change < 0 : change > 0;

    return {
        text: `${sign}${change.toFixed(2)} pp`,
        favorable: change === 0 ? null : favorable
    };
}
// ---------- ----------

// ---------- indicator() ----------
// indicator:
function indicator(favorable) {
    if (favorable === true) return '🟢';
    if (favorable === false) return '🔴';
    return '⚪';
}
// ---------- ----------

// ---------- find the previous successful run ----------
const previous = [...runs]
    .reverse()
    .find(run => run.successful === true);
// ---------- ----------

const currentDurationSeconds = durationToSeconds(current.duration);

// ---------- build historical metrics ----------
const metrics = [
    {
        name: '🧪 Test Cases',
        current: current.total,
        previous: previous?.total,
        change: previous
        ? relativeChange(current.total, previous.total)
        : null
    },
    {
        name: '✅ Pass Rate',
        current: current.passRate,
        previous: previous?.passRate,
        change: previous
        ? percentagePointChange(current.passRate, previous.passRate)
        : null
    },
    {
        name: '❌ Fail Rate',
        current: current.failRate,
        previous: previous?.failRate,
        change: previous
        ? percentagePointChange(current.failRate, previous.failRate, true)
        : null
    },
    {
        name: '⚠️ Flaky Rate',
        current: current.flakyRate,
        previous: previous?.flakyRate,
        change: previous
        ? percentagePointChange(current.flakyRate, previous.flakyRate, true)
        : null
    },
    {
        name: '⏱️ Duration',
        current: currentDurationSeconds,
        previous: previous?.durationSeconds,
        change: previous
        ? relativeChange(currentDurationSeconds, previous.durationSeconds, true)
        : null
    }
];
// ---------- ----------

// ---------- generate outputs ----------
// markdown
const markdownRows = metrics.map(metric => {
    const previousValue =
        metric.previous === undefined
        ? 'N/A'
        : metric.name === '⏱️ Duration'
            ? formatDuration(metric.previous)
            : metric.name.includes('Rate')
            ? `${metric.previous.toFixed(2)}%`
            : metric.previous;

    const currentValue =
        metric.name === '⏱️ Duration'
        ? formatDuration(metric.current)
        : metric.name.includes('Rate')
            ? `${metric.current.toFixed(2)}%`
            : metric.current;

    const change = metric.change
        ? `${indicator(metric.change.favorable)} ${metric.change.text}`
        : '⚪ No baseline';

    return `| ${metric.name} | ${previousValue} | ${currentValue} | ${change} |`;
});

// check for previous run
const heading = previous
    ? `Compared with successful main run #${previous.runNumber || 'N/A'}`
    : 'No previous successful main run is available yet.';

// markdown for the change
const markdown = [
    `> ${heading}`,
    '',
    '| Metric | Previous Run | Current Run | Change |',
    '|---|---:|---:|---:|',
    ...markdownRows,
    '',
    '> Rate changes are shown in percentage points (pp). Test-case and duration changes are relative percentages.',
    '> Test-case growth represents suite growth, not automatically an improvement in quality.'
].join('\n');

// slack for the change
const slack = [
    previous
        ? `*Compared with successful main run #${previous.runNumber || 'N/A'}*`
        : '*Historical baseline: Not available yet*',
    ...metrics.map(metric => {
        const value = metric.name === '⏱️ Duration'
        ? formatDuration(metric.current)
        : metric.name.includes('Rate')
            ? `${metric.current.toFixed(2)}%`
            : metric.current;

        const change = metric.change
        ? `${indicator(metric.change.favorable)} ${metric.change.text}`
        : '⚪ No baseline';

        return `${metric.name}: *${value}*  |  ${change}`;
    })
].join('\n');

// writeFileSync
fs.writeFileSync('historical-test-trend.md', markdown + '\n');
fs.writeFileSync('history/current-trend-slack.txt', slack + '\n');

const delimiter = 'HISTORICAL_TREND_EOF';

fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `HISTORICAL_TREND_TEXT<<${delimiter}\n${slack}\n${delimiter}\n`
);

// log console
console.log('✅ Historical test trend generated.');
console.log(markdown);
// ---------- ----------