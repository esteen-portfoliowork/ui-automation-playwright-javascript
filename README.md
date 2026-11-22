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

The framework leverages Playwright, Page Object Model (POM), GitHub Actions, Allure Reporting, Slack Notifications, Pull Request Validation Dashboards, and a Unified Reporting Architecture powered by shared analytics datasets to support modern quality engineering practices.

This repository demonstrates automation architecture, CI/CD pipelines, reporting integrations, release governance, and documentation management.

## Quick Start

```bash
npm ci
npx playwright install
npx playwright test
```

### Run by Tag

```bash
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep @authentication
npx playwright test --grep @inventory
npx playwright test --grep @filter
```

## Features

- Playwright UI Automation
- Page Object Model (POM)
- Test Tagging Strategy
- Tag-Based Test Execution
- Pull Request Validation
- Manual Test Execution (workflow_dispatch)
- GitHub Actions Execution Summary
- GitHub to GitLab Repository Synchronization
- Allure Reporting
- Playwright HTML Reports
- Automated Pull Request Validation Comments
- Slack Notifications
- Automated Release Notes Generation
- Artifact Publishing
- GitHub Pages Integration
- Release Drafter
- GitHub Release Management
- Unified Reporting Architecture
- Analytics Dataset
- Historical Trend Analysis
- Release Readiness Assessment
- Risk-Based Reporting
- Failed Module Reporting
- Flaky Test Reporting
- Top Risk Module Analysis
- Release Recommendation Indicators

### Validation Reporting

- Workflow Summary Dashboard
- Historical Trend Analysis
- Release Readiness Assessment
- Application Health Dashboard
- Module Breakdown Reporting
- Tag Execution Summary
- Failed Module Reporting
- Failed Test Reporting
- Flaky Test Reporting
- Top Risk Module Reporting
- Slowest Module Analysis
- Pull Request Validation Dashboard
- Slack Execution Dashboard

## Unified Reporting Architecture

The framework uses a centralized reporting architecture to ensure consistent execution metrics across Workflow Summary, Pull Request Comments, and Slack Notifications.

Reporting components are generated from shared datasets and reusable reporting services.

Core Components:

- Analytics Dataset
- Risk Report Dataset
- Historical Trend Dataset
- Shared Test Aggregation Engine
- Workflow Summary Generator
- Pull Request Comment Generator
- Slack Notification Generator

Benefits:

- Single source of truth
- Consistent reporting metrics
- Reduced code duplication
- Easier maintenance
- Scalable reporting architecture

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
│   └── sauce-demo/
├── pages/
│   └── sauce-demo/
├── validations/
│   └── sauce-demo/
├── locators/
│   └── sauce-demo/
├── data/
│   └── sauce-demo/
├── docs/
│   └── test-cases/
│       └── sauce-demo/
├── release/
│   └── templates/
├── playwright.config.js
├── package.json
├──.github/
|   ├── scripts/
│   |  ├── analytics/
|   |  ├── core/
|   |  ├── notifications/
|   |  ├── reporting/
│   └── templates/
│   └── workflows/
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
- Manual Playwright Execution
- Tag-Based Test Execution
- Browser Selection
- Environment Selection
- Retry Configuration
- Worker Configuration

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
| Current Integrations | 9 |
| Release Assets | 6 |
| CI/CD Platforms | 2 |

## Test Documentation

Manual test cases are maintained within:

```text
docs/
└── test-cases/
    └── sauce-demo/
```

## Automated Test Coverage

### Sauce Demo

#### Authentication
- SD-001 Login with Valid Credentials
- SD-002 Login with Invalid Credentials
- SD-003 Login with Empty Credentials
- SD-004 Login with Empty Password
- SD-005 Login with Locked Out Credentials
- SD-006 Logout Successfully

#### Inventory
- SD-007 View Inventory
- SD-008 Validate Product Information
- SD-009 Open Product Details
- SD-010 Validate Product Detail Information

#### Filtering
- SD-011 Filter Products by Name (A to Z)
- SD-012 Filter Products by Name (Z to A)
- SD-013 Filter Products by Price (Low to High)
- SD-014 Filter Products by Price (High to Low)

## Test Tags

The framework supports tag-based execution.

### Available Tags

| Tag | Purpose |
|------|---------|
| @smoke | Critical validation suite |
| @regression | Full regression suite |
| @e2e | End-to-end test execution |
| @authentication | Authentication module |
| @inventory | Inventory module |
| @filter | Product filtering module |
| @positive | Positive scenarios |
| @negative | Negative scenarios |

## Release Assets

| Asset | Description |
|---------|-------------|
| architecture.md | Framework architecture and execution flow |
| dependency-versions.md | Technology and dependency versions |
| integrated-apps.md | Integration inventory and roadmap |
| jira-tickets.md | User stories and requirements traceability |
| release-summary.md | Release overview and capabilities |
| roadmap.md | Planned roadmap |

## Workflow Capabilities

### Pull Request Validation

Automatically executes Playwright validation when a pull request targets the main branch.

### Manual Execution

Supports workflow_dispatch with:

- Browser Selection
  - Chromium
  - Firefox
  - WebKit

- Tag Selection
  - @all
  - @smoke
  - @regression
  - @e2e
  - @authentication
  - @inventory
  - @filter
  - @positive
  - @negative

- Environment Selection
  - DEV
  - QA
  - UAT
  - PROD

- Retry Configuration

- Worker Configuration

- Execution Mode
  - Headless
  - Headed

### Reporting

- GitHub Actions Workflow Summary
- Pull Request Validation Dashboard
- Slack Notification Dashboard
- Historical Trend Reporting
- Release Readiness Reporting
- Risk Analysis Reporting
- Playwright HTML Report
- Allure Report
- JSON Analytics Dataset
- Release Documentation Generation

### Notifications

- Slack execution notifications
- Pull request validation comments
- Historical trend visibility
- Release readiness indicators
- Failed module reporting
- Failed test reporting
- Flaky test reporting
- Top risk module reporting
- Report navigation links

Slack notifications include:

- Execution status
- Build status
- Pass/fail metrics
- Application health dashboard
- Module breakdown
- Tag execution summary
- Failed modules
- Failed tests
- Flaky tests
- Top risk modules
- Slowest module
- Historical execution trends
- Release readiness assessment
- Report links

## Execution Reporting

The framework provides visibility through:

- Workflow Summary Dashboard
- Pull Request Validation Dashboard
- Slack Notification Dashboard
- Historical Trend Reporting
- Release Readiness Assessment
- Top Risk Module Reporting
- Failed Module Reporting
- Failed Test Reporting
- Flaky Test Reporting
- Playwright HTML Reports
- Allure Reports

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