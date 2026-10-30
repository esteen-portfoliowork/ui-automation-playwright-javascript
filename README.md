# UI Playwright - JavaScript

<!-- ![Playwright](https://img.shields.io/badge/Playwright-Automation-green)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![GitHub Actions](https://img.shields.io/badge/CI/CD-GitHub_Actions-blue)
![Allure](https://img.shields.io/badge/Reporting-Allure-orange)
![Release Drafter](https://img.shields.io/badge/Releases-Automated-purple) -->


<p align="center">
  <img src="https://img.shields.io/badge/Playwright_Framework-green">
  <img src="https://img.shields.io/badge/JavaScript-ES6-yellow">
  <img src="https://img.shields.io/badge/CI/CD-GitHub_Actions-blue">
  <img src="https://img.shields.io/badge/CD-Jenkins-red">
  <img src="https://img.shields.io/badge/Reporting-Allure-orange">
  <img src="https://img.shields.io/badge/Notifications-Slack-purple">
  <img src="https://img.shields.io/badge/Releases-Automated-purple">
</p>

## Overview

UI Playwright - JavaScript is an enterprise-ready UI automation framework designed to provide scalable, maintainable, and reliable end-to-end testing.

The framework leverages Playwright, Page Object Model (POM), GitHub Actions, Allure Reporting, Slack Notifications, and Release Management automation to support modern quality engineering practices.

This repository demonstrates automation architecture, CI/CD pipelines, reporting integrations, release governance, and documentation management.

## Quick Start

```bash
npm ci
npx playwright install
npx playwright test
```

## Features

- Playwright UI Automation
- Page Object Model (POM)
- GitHub Actions CI/CD
- Allure Reporting
- Playwright HTML Reports
- Slack Notifications
- GitHub Pages Integration
- Release Drafter
- GitHub Release Management

## Technology Stack

- Playwright
- JavaScript
- Node.js
- GitHub Actions
- Allure Report
- Slack
- GitHub Pages
- Jenkins
- GitLab

## Framework Architecture

For detailed framework architecture and execution flow, see:

- release/templates/architecture.md
- release/templates/integrated-apps.md
- release/templates/release-summary.md

## Project Structure

```text
.
├── tests/
├── pages/
├── locators/
├── data/
├── release/
│   └── templates/
├── playwright.config.js
├── package.json
└── .github/
    └── workflows/
```

## Prerequisites

- Node.js 24+
- npm 11+
- Git
- Visual Studio Code (Recommended)
- Playwright Supported Browsers

## Installation

```bash
git clone https://github.com/esteen-portfoliowork/ui-automation-playwright-javascript.git

cd ui-automation-playwright-javascript

npm ci

npx playwright install
```

## Running Tests

```bash
npm ci
npx playwright install
npx playwright test
```

## Test Reporting

The framework generates:

- Playwright HTML Report
- Allure Report

Reports are available as workflow artifacts and can be published to GitHub Pages.

## CI/CD

GitHub Actions supports:

- Pull Request Validation
- Main Branch Validation
- Manual Allure Publishing
- Release Asset Publishing

## Integrations

Current Integrations:

- Jira
- GitHub
- GitHub Actions
- Slack
- Jenkins
- GitLab
- Allure Report
- GitHub Pages

## Release Management

Release workflow:

Jira
  ↓
GitHub Issue
  ↓
Pull Request
  ↓
Code Review
  ↓
Merge to Main
  ↓
Release Drafter
  ↓
GitHub Release
  ↓
Release Asset Publishing

This repository uses:

- GitHub Releases
- Release Drafter
- Semantic Versioning
- Automated Release Asset Publishing

## Repository Statistics

| Metric | Value |
|----------|----------|
| Automation Tool | Playwright |
| Programming Language | JavaScript |
| Supported Browsers | 3 |
| Current Integrations | 8 |
| Release Assets | 5 |
| CI/CD Platforms | 2 |

## Release Assets

| Asset | Description |
|---------|-------------|
| architecture.md | Framework architecture and execution flow |
| dependency-versions.md | Technology and dependency versions |
| integrated-apps.md | Integration inventory and roadmap |
| jira-tickets.md | User stories and requirements traceability |
| release-summary.md | Release overview and capabilities |

## Documentation

| Document | Purpose |
|-----------|-----------|
| architecture.md | Framework architecture |
| dependency-versions.md | Technology versions |
| integrated-apps.md | Integration inventory |
| jira-tickets.md | Requirements traceability |
| release-summary.md | Release overview |

## Future Enhancements

- Implement Jenkins every PR merge
- Auto-merge PR
- Auto-create Release
- BrowserStack Integration
- Microsoft Teams Notifications
- Azure DevOps Integration
- SonarQube Integration
- Automated Jira Synchronization
- Automated Release Metadata Generation

## Current Status

| Item | Status |
|--------|----------|
| Framework | Active Development |
| GitHub Repository | Implemented |
| GitHub Actions | Implemented |
| Slack Integration | Implemented |
| Jira Integration | In Progress |
| Jenkins Integration | In Progress |
| GitLab Integration | In Progress |
| Allure Report | In Progress |
| GitHub Pages | In Progress |
| Release Management | In Progress |

## Author

**Esteen Valdez**  
QA Automation Consultant

### Specializations
- Playwright Automation
- API Testing
- CI/CD Automation
- Test Framework Design
- Quality Engineering
