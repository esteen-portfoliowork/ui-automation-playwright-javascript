# Architecture

## Overview

UI Playwright - JavaScript is built using the Page Object Model (POM) design pattern and integrated with multiple applications.

## Architecture Components

- Playwright
- Node.js
- GitHub Actions
- Allure Reports
- Slack Notifications
- GitHub Pages

## Design Pattern

- Page Object Model (POM)
- Data-Driven Testing

## Supported Browsers

- Chromium
- Firefox
- WebKit

## Framework Structure

tests/
pages/
data/
locators/
.github/workflows/

## Test Types

- Smoke
- Regression
- API
- End-to-End

## Reporting Components

- Playwright HTML Report
- Allure Report

## Execution Flow

GitHub Actions
↓
Playwright
↓
Allure Results
↓
Allure Report
↓
GitHub Pages
↓
Slack Notification

## Release Metadata

| Item | Value |
|--------|--------|
| Release Version | v0.0.1 |
| Release Date | 2026-10-30 |
| Repository | UI Playwright - JavaScript |