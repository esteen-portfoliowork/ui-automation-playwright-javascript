// Reusable functions for report formatting and GitHub Actions outputs

// Import fs
const fs = require('fs');

// ---------- escapeMarkdown() ----------
// escapeMarkdown: Prevents broken Markdown table formatting
function escapeMarkdown(value) {
    return String(value ?? 'N/A')
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ')
        .trim();
}
// ---------- ----------

// ---------- formatPercent() ----------
// formatPercent: Standardizes percentage display
function formatPercent(value, decimals = 2) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return '0.00%';
    }

    return `${number.toFixed(decimals)}%`;
}
// ---------- ----------

// ---------- writeMarkdown() ----------
// writeMarkdown: Writes Markdown files consistently
function writeMarkdown(filePath, content) {
    fs.writeFileSync(
        filePath,
        `${content.trimEnd()}\n`,
        'utf8'
    );
}
// ---------- ----------

// ---------- setOutput() ----------
// setOutput: Handles GitHub Actions outputs in one place
// This also supports running scripts locally without GITHUB_OUTPUT.
function setOutput(name, value) {
    const outputPath = process.env.GITHUB_OUTPUT;

    if (!outputPath) {
        return;
    }

    const delimiter = `EOF_${name}_${process.pid}`;

    const output = String(value ?? '');

    if (output.includes(delimiter)) {
        throw new Error(
            `Output value contains the delimiter for ${name}.`
        );
    }

    fs.appendFileSync(
        outputPath,
        `${name}<<${delimiter}\n${output}\n${delimiter}\n`
    );
}
// ---------- ----------

module.exports = {
    escapeMarkdown,
    formatPercent,
    writeMarkdown,
    setOutput
};