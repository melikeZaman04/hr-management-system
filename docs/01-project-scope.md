# Project Scope

## Problem Definition

Small HR teams often track employee data, leave requests, salary adjustments, devices, and documents across spreadsheets, folders, and separate communication channels. This makes it difficult to see reliable employee information, monitor leave status, calculate internal salary estimates, and track company assets from one place.

## Project Goal

The goal is to build a centralized HR Management System that helps Admin/HR users manage employees, leave records, simplified salary calculations, device assignments, and employee-related documents through a web-based dashboard.

The system should be planned and developed as a maintainable software project, using GitHub Issues, milestones, documentation, branches, and pull requests.

## Target Users

- Admin / HR users who manage employee records, leave approvals, salary estimates, documents, and devices.
- Managers who may later review employee information and approve leave requests for their teams.
- Employees who may later submit leave requests and view their own information.

## MVP Scope

The first MVP will focus on the Admin/HR experience.

Included in the MVP:

- Admin login
- Employee creation and listing
- Employee detail page
- Leave request tracking
- Leave approval and rejection
- Simplified salary calculation based on unpaid leave
- Device creation and assignment tracking
- CV and invoice document storage
- Basic dashboard metrics

## Out of Scope for the First Version

- Legal payroll processing
- Accounting integration
- Tax calculations
- Bank payment processing
- Advanced payroll compliance
- Employee self-service portal
- Manager approval portal
- Complex organizational hierarchy
- Automated email notifications
- Production-grade analytics

## Salary Calculation Note

This project is not a legal payroll or accounting system. The salary calculation module is a simplified internal estimation tool based on unpaid leave.

Initial formula:

- Daily wage = base salary / 30
- Deduction = unpaid leave days * daily wage
- Calculated salary = base salary - deduction
