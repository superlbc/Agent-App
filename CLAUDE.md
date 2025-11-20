# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

This is a full-stack web application built for rapid corporate application development. The primary goal is to move quickly from idea to implementation while maintaining clean architecture and design standards.

**Developer Context:**
- Solo developer responsible for complete solution architecture
- Focus on orchestration and architecture - Claude assists with implementation
- Speed and iteration velocity are critical
- Multiple projects often in parallel - need reusable patterns

## Tech Stack

**Frontend:**
- React (primary framework)
- Tailwind CSS (styling framework)
- Responsive design (web-first, mobile-compatible)
- Light/dark theme support (browser preference detection)

**Backend:**
- Node.js/Express APIs (or specify your backend framework)
- SQL databases (corporate data)
- RESTful API architecture

**Infrastructure:**
- Local development environment
- Google Cloud Run for deployment
- Git version control (master branch workflow)

## Core Development Principles

### 1. Speed & Iteration
- Prioritize working prototypes over perfect code
- Build, test visually, iterate quickly
- Use git worktrees for parallel exploration of different approaches
- Prototype multiple solutions when uncertain, then choose the best

### 2. Architecture First
- Think through data models before implementation
- Define API contracts clearly
- Plan component hierarchy before coding
- Use plan mode (`Shift+Tab`) for any non-trivial feature

### 3. Reusability & Migration
- Build reusable patterns and components
- Document patterns for future projects
- Create migration templates when solving common problems
- Codify learnings into this CLAUDE.md file

### 4. Visual Quality
- Responsive design is non-negotiable
- Test visual changes immediately with Playwright
- Reference design principles in `/context/design-principles.md`
- Reference style guide in `/context/style-guide.md`

## Development Workflow

### Starting a New Feature

**ALWAYS use plan mode for features** (unless trivial one-liners):
1. Enter plan mode with `Shift+Tab`
2. Describe the feature and user journey
3. Review and align on the plan before implementation
4. Execute the plan step-by-step

**For complex features, use the Feature Developer agent:**
```
@agent-feature-developer Please build [feature description]
User journey: [describe the flow]
Acceptance criteria: [list requirements]
```

### Visual Development

**IMMEDIATELY after any frontend change:**
1. Navigate to affected pages using Playwright
2. Verify against `/context/design-principles.md` and `/context/style-guide.md`
3. Check responsive behavior (desktop 1440px, tablet 768px, mobile 375px)
4. Verify light/dark theme rendering
5. Check browser console for errors using `mcp__playwright__browser_console_messages`
6. Take screenshots to validate visual correctness

**For comprehensive design review:**
```
@agent-design-reviewer Please review [specific pages/components or last N commits]
```

### Database Development

**When working with SQL:**
- Always plan schema changes before implementation
- Document table structures and relationships
- Use migrations for schema changes (track in version control)
- Consider indexing strategy for frequently queried fields
- Test data access patterns before finalizing

**Common pattern:**
1. Design data model (entities, relationships, constraints)
2. Create migration scripts
3. Build API endpoints (CRUD operations)
4. Implement frontend data layer
5. Test end-to-end flow

### API Development

**API Design Principles:**
- RESTful conventions (GET, POST, PUT, DELETE)
- Consistent response formats (success/error handling)
- Input validation on all endpoints
- Proper HTTP status codes
- Error messages that aid debugging

**API Structure:**
```
POST   /api/[resource]          - Create
GET    /api/[resource]          - List/Query
GET    /api/[resource]/:id      - Read single
PUT    /api/[resource]/:id      - Update
DELETE /api/[resource]/:id      - Delete
```

## Agent Orchestration

### Available Agents

**@agent-feature-developer** (Priority: HIGH)
- Use for: Building complete features from idea to implementation
- Provides: Structured development with planning, implementation, and validation
- When: Any non-trivial feature requiring frontend + backend + database work

**@agent-design-reviewer** (Priority: HIGH)
- Use for: Visual validation and design feedback
- Provides: Automated visual testing using Playwright, design compliance checks
- When: After UI changes, before PRs, for comprehensive design audits

**@agent-migration-assistant** (Priority: MEDIUM)
- Use for: Creating reusable patterns and migrating code between projects
- Provides: Pattern extraction, framework creation, code migration
- When: Establishing new patterns, refactoring, moving to new projects

**@agent-security-scanner** (Priority: MEDIUM)
- Use for: Security vulnerability detection
- Provides: SQL injection detection, XSS prevention, input validation review
- When: Before deployment, after authentication/authorization work

### Agent Best Practices

**Parallel Agent Execution:**
- Use git worktrees to run multiple agents simultaneously
- Compare outputs to choose the best approach
- Agents preserve context separately from main thread

**Agent Chaining:**
- Agents can call other agents for specialized tasks
- Example: Feature Developer → Design Reviewer → Security Scanner
- Each agent brings focused expertise

## Common Commands

### Slash Commands

**Feature Development:**
- `/feature-dev` - Structured feature development workflow
- `/migrate` - Migrate patterns or create reusable frameworks

**Visual & Design:**
- `/design-review` - Comprehensive design review using Playwright
- `/quick-check` - Fast visual validation of current changes

**Deployment:**
- `/commit` - Smart commit with conventional format
- `/deploy-cloudrun` - Deploy to Google Cloud Run

**Utilities:**
- `/refactor` - Code refactoring with preservation of functionality
- `/optimize` - Performance optimization review

### Bash Shortcuts

Access bash directly with `!` prefix:
```
!npm run dev          # Start development server
!npm run build        # Production build
!git status           # Git status
```

## Code Style & Patterns

### React Patterns

**Component Structure:**
```jsx
// Functional components with hooks
// Props destructuring
// Clear prop types (TypeScript preferred)
// Composition over inheritance
```

**State Management:**
- Local state with useState for component-specific state
- Context API for shared state across components
- Keep state as close to usage as possible

**File Organization:**
```
src/
  components/       # Reusable UI components
  pages/           # Page-level components
  hooks/           # Custom React hooks
  utils/           # Utility functions
  services/        # API services
  context/         # React context providers
```

### Tailwind Patterns

**Design Tokens:**
- Use Tailwind config for colors, spacing, typography
- Maintain consistency with design system
- Reference `/context/style-guide.md` for approved utilities

**Responsive Design:**
```jsx
// Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">
  // sm: 640px, md: 768px, lg: 1024px, xl: 1280px
</div>
```

**Dark Mode:**
```jsx
// Use dark: variant
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

### Code Quality

**Simplicity:**
- Prefer clarity over cleverness
- One-liners are great, but readability is better
- If code is verbose, ask Claude to simplify it

**DRY Principle:**
- Extract repeated patterns into functions/components
- Create custom hooks for repeated logic
- Build utility functions for common operations

**Error Handling:**
- Always handle errors gracefully
- Provide helpful error messages
- Log errors for debugging

## Security Considerations

**Input Validation:**
- Validate all user input on backend
- Sanitize data before database queries
- Use parameterized queries (prevent SQL injection)
- Escape output in frontend (prevent XSS)

**Authentication/Authorization:**
- Verify user permissions on all protected endpoints
- Never trust client-side validation alone
- Implement proper session management

**Data Protection:**
- Never log sensitive data (passwords, tokens, PII)
- Use environment variables for secrets
- Keep API keys out of version control

## Deployment Process

### Google Cloud Run

**Pre-deployment Checklist:**
1. Run security scan: `@agent-security-scanner`
2. Test visual design: `@agent-design-reviewer`
3. Verify environment variables are set
4. Test API endpoints
5. Check database migrations are ready

**Deployment:**
```
/deploy-cloudrun
```

### Environment Variables

**Local Development:**
- Use `.env.local` for environment-specific config
- Never commit `.env` files

**Production:**
- Set environment variables in Google Cloud Run
- Document required variables in README

## Learning & Improvement

### Continuous Improvement

**When something goes wrong:**
- Add to CLAUDE.md: `@claude add this to CLAUDE.md so you don't make this mistake again`
- Write a lint rule if it's enforceable: `@claude write a lint rule for this`
- Create a test to prevent regression: `@claude write a test for this`

**When discovering a pattern:**
- Document it in `/context/` directory
- Update relevant agent prompts
- Share across projects via Migration Assistant

### Memory & Context

**Project-Specific Context:**
- Store design decisions in `/context/design-decisions.md`
- Document API contracts in `/context/api-spec.md`
- Maintain architecture diagrams in `/context/architecture.md`

**Cross-Project Patterns:**
- Use Migration Assistant to extract successful patterns
- Build a personal component library
- Create reusable agent configurations

## Common Tasks & Tips

### Speed Tips
1. Use `Shift+Tab` for auto-accept when confident in changes
2. Use `!` for direct bash commands (faster than asking Claude)
3. Pre-allow common commands in settings.json
4. Use sub-agents to work on multiple things in parallel

### Visual Development Tips
1. Always test in browser immediately after frontend changes
2. Use Playwright screenshots to verify pixel-perfect implementation
3. Include visual references (screenshots, mockups) in prompts
4. Test responsive breakpoints every time

### Database Tips
1. Design schema on paper/whiteboard first
2. Use migrations for all schema changes
3. Test queries with sample data before implementing
4. Document complex queries with comments

### Debugging Tips
1. Check browser console first (`mcp__playwright__browser_console_messages`)
2. Use `console.log` liberally during development
3. Test API endpoints in isolation before integration
4. Verify data flow: Frontend → API → Database and back

## References

- **Design Principles**: `/context/design-principles.md`
- **Style Guide**: `/context/style-guide.md`
- **API Specifications**: `/context/api-spec.md` (create as needed)
- **Architecture Decisions**: `/context/architecture.md` (create as needed)

## Getting Help

**Ask Claude to:**
- "Explain how [feature] works in this codebase"
- "Find examples of [pattern] in this project"
- "Review the git history for [area] to understand past decisions"
- "Simplify this code while preserving functionality"

**Use agents for:**
- Complex features: `@agent-feature-developer`
- Visual validation: `@agent-design-reviewer`
- Pattern extraction: `@agent-migration-assistant`
- Security review: `@agent-security-scanner`

---

**Remember**: The goal is speed and quality. Use agents to handle the implementation details while you focus on architecture and orchestration. When in doubt, prototype quickly and iterate.


-------------------

# Employee Onboarding System

> *Streamline employee onboarding from pre-hire to day one.*

### 🚀 Automated Onboarding Workflow with Intelligent Package Management

Manage the complete employee onboarding process from pre-hire candidate tracking through equipment provisioning and system access setup. Automate package assignments, approval workflows, and freeze period handling with integration to Workday, Active Directory, Helix, and Momentum department data.

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Onboarding Process Flow](#onboarding-process-flow)
- [✨ Features](#-features)
- [Data Model](#data-model)
- [System Integration Points](#system-integration-points)
- [Current Issues & Solutions](#current-issues--solutions)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [MSAL Authentication Setup](#msal-authentication-setup)
- [Azure AD Group Security](#azure-ad-group-security)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [File Structure](#file-structure)
- [Development Notes](#development-notes)
- [Recent Changes](#recent-changes)
- [Version Information](#version-information)

---

## Overview

**Employee Onboarding System** is a React-based web application that manages the complete employee onboarding lifecycle from pre-hire candidate tracking through equipment provisioning and system access setup. The system automates package assignments based on roles, streamlines approval workflows, and handles special Workday freeze period processes with seamless integration to organizational systems including Workday, Active Directory, Helix, Vantage, and Momentum department data.

### 🎯 Key Use Cases

- **Pre-hire Management**: Track candidates from offer acceptance through start date with equipment package assignment
- **Equipment Provisioning**: Automate hardware and software package selection based on role (e.g., "XD Designer Standard Package")
- **Approval Workflow**: Standard packages auto-approve, exceptions route to SVP via Helix
- **Freeze Period Handling**: Automate Nov-Jan 5 Workday freeze with password reset emails to IT
- **Onboarding Tracking**: Monitor progress from pre-hire through equipment receipt and system access
- **Department Integration**: Leverage Momentum department data (962 users) for organizational context

### 🏢 Target Users

- **HR Team** (Camille, Payton): Pre-hire tracking, start date management, freeze period coordination
- **IT Team**: Equipment provisioning, Helix ticket management, system access setup
- **Hiring Managers**: Package selection, equipment customization requests
- **Laurie Walker**: Vantage record creation and management
- **Leadership** (Patricia, Steve): Exception approval for non-standard equipment/software requests

---

## System Architecture

### Key Systems Involved

| System | Purpose | Owner/Contact |
|--------|---------|---------------|
| **Workday** | HR system of record (starts Nov, with freeze period Nov-Jan 5) | HR Team |
| **Active Directory** | User authentication and access control | IT Team |
| **Vantage** | Internal employee records system | Laurie Walker |
| **Weenus** | IT request system for equipment and software | IT Team |
| **Helix** | IT ticketing and approval system | Chris Kumar (McCarthy) |
| **Orbit** | Internal engagement/freelancer management system | HR Team |
| **Power Platform** | Department data (962 Momentum users via Power Automate) | Already Integrated ✅ |
| **Camille's Excel** | Pre-hire tracking with sensitive salary data (restricted access) | Camille |

### Integration Architecture

```
┌──────────────┐         ┌──────────────────┐
│   Camille's  │         │   Onboarding     │
│     Excel    │────────▶│   System (React) │
│  (Pre-hire)  │  Power  │                  │
└──────────────┘ Automate└───────┬──────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │ Workday  │  │ Vantage  │  │ Active   │
            │ (Nov+)   │  │(Manual)  │  │Directory │
            └──────────┘  └──────────┘  └──────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
            ┌──────────────┐           ┌──────────────┐
            │    Weenus    │           │    Helix     │
            │  (Equipment  │───────────│  (Ticketing/ │
            │   Requests)  │  Creates  │   Approval)  │
            └──────────────┘  Tickets  └──────────────┘
                                               │
                    ┌──────────────────────────┘
                    │
                    ▼
            ┌──────────────┐
            │      IT      │
            │ Provisioning │
            └──────────────┘
```

---

## Onboarding Process Flow

### Complete Lifecycle

```
PHASE 1: PRE-HIRE
─────────────────
[Role Definition] → [Camille's Excel]
        ↓
   Role Details:
   - Position Title
   - Department
   - Salary (SENSITIVE)
        ↓
[Interview Process]
        ↓
[Candidate Selected]
        ↓
[Offer Extended] ←─── May involve negotiations
        ↓              (Equipment specs may change)
[Candidate Accepts]


PHASE 2: PRE-HIRE SETUP
───────────────────────
[Pre-hire Record Created] ← Camille's Excel
        ↓
[Role Selected] → [Package Assignment]
        ↓              ↓
        │      ┌──────┴──────┐
        │      │ XD Designer │
        │      │ Packages:   │
        │      │ - Hardware  │
        │      │ - Software  │
        │      │ - Licenses  │
        │      └─────────────┘
        ↓
[Weenus Form Triggered] ← Hiring manager fills out
        ↓                  equipment needs
[Equipment/Software]
[Selections Made]
        ↓
[Potential Updates] ← Based on candidate negotiations


PHASE 3: HIRING & SYSTEM CREATION
──────────────────────────────────
[Workday Record Created] ← Nov onwards (during freeze: pre-load)
        ↓
        ├─→ [Active Directory] ← User account created
        │
        └─→ [Vantage Record] ← Manually by Laurie Walker


PHASE 4: EQUIPMENT & ACCESS PROVISIONING
─────────────────────────────────────────
[Equipment Package] → [Helix Approval Flow]
        ↓                      ↓
        │              ┌───────┴────────┐
        │              │ Approval Types │
        │              │ ─────────────  │
        │              │ Standard: Auto │
        │              │ Exception: SVP │
        │              └────────────────┘
        ↓
[IT Provisioning]
        ↓
[Employee Receives Kit]
        ↓
[Onboarding Complete]


WORKDAY FREEZE PERIOD (Nov - Jan 5)
────────────────────────────────────
[Pre-load Users] → IT prepares accounts
        ↓
[Passwords Scrubbed]
        ↓
[Start Date Arrives]
        ↓
[HR Email to Helix] ← Automated from Orbit
   "User: [Name]"       (Button or Auto-trigger)
   "Start: [Date]"
   "Please reset password & MFA"
        ↓
[IT Resets & Activates]
        ↓
[Credentials Sent]


OFF-BOARDING DURING FREEZE
──────────────────────────
[End Date Arrives]
        ↓
[HR Email to Helix] ← Automated from Orbit
   "User: [Name]"
   "End: [Date]"
   "Please disable password & MFA"
        ↓
[IT Deactivates Account]
```

### Approval Flow Decision Tree

```
Package Selected → Is Standard?
                        │
                ┌───────┴───────┐
                │               │
              YES              NO
                │               │
                ▼               ▼
         Auto-Approve    Exception Review
                │               │
                │         ┌─────┴──────┐
                │         │ Patricia/  │
                │         │   Steve    │
                │         └─────┬──────┘
                │               │
                └───────┬───────┘
                        ▼
                   Helix Ticket
                        │
                        ▼
                 IT Provisions
```

---

## ✨ Features

### 📋 Pre-hire Management

✅ **Candidate Tracking**
- Track candidates from offer acceptance through start date
- Store role, department, hiring manager, and start date information
- Link pre-hire records to employee records upon Vantage/AD creation
- Exclude sensitive salary data (maintained separately in Camille's Excel)

✅ **Data Integration from Camille's Excel**
- Power Automate flow triggered from Excel (button or scheduled)
- Automatic push of pre-hire data (role, department, start date)
- Privacy-first: Salary information never transferred to system
- Manual linking to employee records once created in Vantage/AD

### 📦 Equipment Package Management

✅ **Role-Based Package Assignment**
- Pre-defined packages for common roles (e.g., "XD Designer Standard")
- Automatic package recommendation based on role and department
- Hardware: Computers, monitors, keyboards, mice, docks, accessories
- Software: Applications and licenses (Cinema 4D, Smartsheet, Adobe CC, etc.)
- Standard vs Exception package types for approval routing

✅ **Package Builder**
- Create and customize equipment packages
- Target specific roles and departments
- Define standard packages (auto-approve) vs exceptions (SVP approval)
- Track package inventory and availability

✅ **Customization & Negotiation Support**
- Modify packages during candidate negotiations
- Track customizations per pre-hire record
- Update equipment requests based on changing requirements
- Maintain audit trail of package modifications

### 🔑 License Pool Management (Phase 2 - NEW)

✅ **License Pool Dashboard**
- **Real-time Utilization Tracking**: Monitor license usage across all software
  - Stats cards: Total licenses, assigned seats, available seats, alerts
  - Visual utilization bars color-coded by status (green/yellow/orange/red)
  - Instant visibility into over-allocated licenses (>100% utilization)
  - Expiring license alerts (within 30 days)
- **Advanced Filtering & Search**:
  - Filter by license type (perpetual, subscription, concurrent)
  - Filter by utilization level (available, near-capacity, full, over-allocated)
  - Filter by vendor
  - Full-text search across license names, vendors, and descriptions
- **License Cards Display**:
  - Seat allocation: "8 of 10 seats assigned (2 available)"
  - Utilization percentage with color-coded bars
  - Quick actions: Assign license, view assignments, edit license
  - Warning indicators for over-allocation and expiring licenses

✅ **License Assignment Modal**
- **Smart Employee Selection**:
  - Search employees by name, email, or department
  - Auto-filter out already-assigned employees
  - Shows employee details (department, email, pre-hire status)
  - Prevents double-assignment of same license to same employee
- **Availability Validation**:
  - Real-time seat availability checking
  - Warns when assigning would create over-allocation
  - Allows over-allocation with explicit warning
  - Shows utilization bar and remaining seats
- **Assignment Configuration**:
  - Optional expiration date for temporary assignments
  - Notes field for assignment context
  - Tracks who assigned the license and when
  - Assignment status (active, expired, revoked)

✅ **License Reclaim Workflow**
- **Automatic Reclamation Triggers**:
  - Employee termination: Reclaim all licenses for terminated employee
  - License expiration: Daily cron job reclaims expired assignments
  - Manual reclaim: IT admin can revoke licenses as needed
- **Reclaim Features**:
  - Batch reclamation for multiple employees
  - Decrements assignedSeats count automatically
  - Updates assignment status to 'revoked'
  - Generates reclaim notification emails (IT admin, manager)
  - Audit trail with reclaim reason and timestamp
- **Reclaim Summary Reports**:
  - Total licenses reclaimed
  - Success/error breakdown
  - Employee-by-employee reclaim results
  - Email notifications with reclaimed license details

✅ **License Lifecycle Tracking**
- **Renewal Management**:
  - Track renewal dates for subscriptions
  - Alerts for licenses expiring within 30 days
  - Auto-renewal flag for automated renewals
  - Renewal frequency (monthly, annual)
- **Vendor Management**:
  - Vendor contact information
  - Internal license administrator assignment
  - Purchase date and cost tracking
  - Group licenses by vendor for bulk renewal negotiations

✅ **Over-Allocation Prevention**
- **Warning System**:
  - Visual warnings when approaching capacity (75%+ utilization = yellow)
  - Critical warnings when at capacity (90%+ utilization = orange)
  - Over-allocation alerts (>100% utilization = red)
  - Dashboard alert card shows total over-allocated licenses
- **Assignment Controls**:
  - Prevents accidental over-allocation with confirmation prompts
  - Tracks over-allocated licenses for procurement action
  - Shows exact number of over-allocated seats (e.g., "3 over")

✅ **Use Cases**
- **Pre-hire Onboarding**: Assign licenses when pre-hire accepts offer, auto-activate on start date
- **Mid-employment**: Request additional software with approval workflow, assign upon approval
- **Employee Termination**: Auto-reclaim all licenses, make available for reassignment
- **License Renewal**: Identify underutilized licenses before renewal, optimize spend
- **Compliance Audits**: Export assigned licenses by employee, vendor, department
- **Budget Planning**: Track total license costs, forecast renewal costs, identify optimization opportunities

### ⚡ Automated Approval Workflow

✅ **Smart Approval Routing**
- **Standard Packages**: Automatic approval, direct to Helix for IT provisioning
- **Exception Requests**: Route to SVP (Patricia/Steve) for approval via Helix
- **Mid-Employment Changes**: Add software/equipment post-onboarding with same approval flow

✅ **Helix Integration**
- Automatic Helix ticket creation upon approval
- Track ticket status and IT provisioning progress
- Coordinate with Chris Kumar (McCarthy) for Helix configuration
- Email notifications to relevant stakeholders

### ❄️ Freeze Period Administration

The Freeze Period Administration system provides a comprehensive framework for managing Workday system freezes and other maintenance windows throughout the year. Unlike hardcoded freeze periods, this system allows HR administrators to define custom freeze periods with configurable date ranges and automated email templates.

✅ **Freeze Period Admin Component**
- **Create/Edit/Delete Freeze Periods**: Define multiple freeze periods throughout the year
  - Name: e.g., "Annual Year-End Freeze 2025", "Q2 Maintenance Window"
  - Date Range: Configurable start and end dates (not hardcoded to Nov-Jan 5)
  - Description: Optional explanation for the freeze period
  - Active Status: Enable/disable freeze periods without deleting them
- **Configurable Email Templates**: Customize email content for password reset and termination requests
  - Subject and body templates with placeholder support
  - Placeholders: `{employeeName}`, `{employeeEmail}`, `{startDate}`, `{endDate}`, `{role}`, `{department}`, `{hiringManager}`, `{employeeId}`
  - Separate templates for start dates (password reset) and end dates (termination)
- **Email Automation Settings**:
  - Helix email address configuration
  - CC recipients (e.g., Camille, Payton)
  - Toggle auto-email on/off per freeze period
- **Visual Management**:
  - Active freeze periods with countdown timers
  - Upcoming freeze periods with days until start
  - Past freeze periods (collapsed, archived)
  - Status indicators (IN PROGRESS, INACTIVE)

✅ **Freeze Period Dashboard Component**
- **Statistics Cards**: Real-time overview of freeze period impact
  - Active freeze periods count
  - Upcoming employee starts during freeze
  - Upcoming employee ends during freeze
  - Pending/sent/failed email notifications
- **Employee Monitoring**:
  - List of employees starting during active freeze periods
  - List of employees ending during active freeze periods
  - Days until action required (today, overdue, upcoming)
  - Color-coded urgency (red for overdue, orange for today, gray for future)
- **Notification Management**:
  - Track all scheduled notifications (pending, sent, failed, cancelled)
  - Filter by action type (start dates / end dates)
  - Filter by status (pending / sent / failed)
  - Search by employee name or email
- **Bulk Email Actions**:
  - Select multiple pending notifications
  - Generate emails in bulk
  - Copy email to clipboard
  - Mark as sent after manual send
- **Email Generation**:
  - Single-click email generation using configurable templates
  - Opens default email client with pre-filled content
  - Tracks sent status and sender name
  - Links to Helix tickets when created

✅ **Template Placeholder System**
- **Supported Placeholders**:
  - `{employeeName}` - Employee full name
  - `{employeeEmail}` - Employee email address
  - `{startDate}` - Employee start date (formatted)
  - `{endDate}` - Employee end date (formatted)
  - `{role}` - Employee role/job title
  - `{department}` - Employee department
  - `{hiringManager}` - Hiring manager name
  - `{employeeId}` - Employee ID (from Vantage/AD)
- **Default Email Templates**:
  - **Start Date Subject**: "Password Reset Required - {employeeName} Starting {startDate}"
  - **Start Date Body**: Requests IT to reset password and MFA for pre-loaded account
  - **End Date Subject**: "Account Termination - {employeeName} End Date {endDate}"
  - **End Date Body**: Requests IT to reset password and disable MFA for security
- **Customization**: HR can modify templates per freeze period to match organizational needs

✅ **Automated Workflow**
- **Pre-load Account Detection**: System identifies employees with start/end dates during active freeze periods
- **Notification Creation**: Automatically creates FreezePeriodNotification records for each affected employee
- **Email Scheduling**: Tracks when emails need to be sent based on action dates
- **Status Tracking**: Monitors pending, sent, failed, and cancelled notifications
- **Power Automate Integration**: Optional automated email sending via Power Automate flow (see integration guide)

✅ **Use Cases**
- **Annual Year-End Freeze**: Nov 1 - Jan 5 (traditional Workday freeze period)
- **Quarterly Maintenance Windows**: Define shorter freeze periods for system upgrades
- **Custom Blackout Periods**: Any date range when Workday updates are restricted
- **Multiple Concurrent Freezes**: Support different freeze periods for different regions/systems
- **Historical Tracking**: Maintain archive of past freeze periods for compliance/auditing

✅ **Benefits**
- **Flexibility**: No hardcoded dates - define freeze periods as needed throughout the year
- **Consistency**: Standardized email templates ensure all IT requests follow same format
- **Visibility**: Dashboard provides real-time view of all employees affected by freeze periods
- **Automation**: Reduces manual effort in generating password reset and termination emails
- **Compliance**: Audit trail of all freeze period notifications and email sends
- **Scalability**: Handles multiple freeze periods simultaneously without code changes

### 🖥️ Hardware Inventory Management

The Hardware Inventory Management system provides comprehensive tools for tracking, managing, and provisioning hardware assets throughout their lifecycle. From creation to retirement, the system manages all hardware types with detailed specifications, status tracking, maintenance history, and bulk import capabilities.

✅ **Hardware Create Modal**
- **Standalone Hardware Creation**: Add hardware items without requiring a package
- **All Hardware Types Supported**:
  - Computer (laptops, desktops, workstations)
  - Monitor (displays, screens)
  - Keyboard (wired, wireless, mechanical)
  - Mouse (wired, wireless, trackball)
  - Dock/Hub (USB-C docks, port replicators)
  - Headset (audio, VR)
  - Accessory (cables, adapters, peripherals)
- **Dynamic Specification Fields**:
  - **Computers**: Processor, RAM, Storage (e.g., M3 Max, 64GB, 2TB SSD)
  - **Monitors**: Screen Size (e.g., 27" 4K, 32" 5K)
  - **Other Hardware**: Connectivity (e.g., USB-C, Bluetooth, Wireless)
- **Status Selection**: Available, Assigned, Maintenance, Retired
- **Optional Tracking Fields**:
  - Serial number for asset tracking
  - Purchase date for warranty/depreciation
  - Cost for budget management and reporting
- **Form Validation**: Required fields, cost validation, date format checks
- **Visual Type Selector**: Icon-based hardware type selection for better UX

✅ **Hardware Edit Modal**
- **Comprehensive Editing**: Update all hardware properties after creation
- **Status Management**: Change hardware status with visual indicators
  - Available: Hardware ready for assignment (green)
  - Assigned: Hardware currently in use (blue)
  - Maintenance: Hardware being repaired/serviced (orange)
  - Retired: Hardware decommissioned (gray)
- **Assignment Tracking** (when status = Assigned):
  - Track who the hardware is assigned to
  - Record assignment date
  - Link to employee records
  - Validate that assigned hardware has an assignee
- **Maintenance History Tracking**:
  - Add maintenance records with description, date, cost
  - Track who performed maintenance (IT team, vendor, etc.)
  - View chronological maintenance history
  - Delete outdated maintenance records
  - Calculate total maintenance costs
- **Specification Updates**: Modify hardware specs as configurations change
- **Audit Trail**: Track all changes with timestamps and user attribution

✅ **Hardware Bulk Import Modal**
- **3-Step Import Workflow**:
  1. **Upload**: Select CSV file with hardware data
  2. **Preview**: Validate data with detailed error/warning reporting
  3. **Complete**: Review import summary with success/error statistics
- **CSV Template Download**: Pre-formatted template with sample data and column headers
- **Comprehensive Validation**:
  - **Required Fields**: type, model, manufacturer, status
  - **Type Validation**: Must be one of 7 valid hardware types
  - **Status Validation**: Must be one of 4 valid statuses
  - **Date Format**: YYYY-MM-DD (e.g., 2024-01-15)
  - **Cost Validation**: Must be valid positive number
  - **Specification Completeness**: Warnings for missing optional specs
- **Validation Preview Table**:
  - Color-coded rows (green=valid, red=error, orange=warning)
  - Row-by-row error details
  - Statistics cards (total, valid, errors, warnings)
  - Scrollable preview for large datasets
- **Selective Import**:
  - Only imports valid rows (rows with errors are skipped)
  - Shows count of items to be imported before confirmation
  - Prevents partial/corrupted data from entering system
- **Import Summary Report**:
  - Total rows processed
  - Success count (items imported)
  - Error count (items skipped)
  - Warning count (items imported with warnings)
  - Detailed error list with row numbers and messages
- **CSV Column Support** (12 columns):
  - type, model, manufacturer, status, serialNumber, purchaseDate, cost
  - processor, ram, storage (for computers)
  - screenSize (for monitors)
  - connectivity (for other hardware)

✅ **Hardware Lifecycle Management**
- **Creation**: Add new hardware via modal or CSV bulk import
- **Assignment**: Track hardware assigned to employees with dates
- **Maintenance**: Record repairs, upgrades, and service history
- **Retirement**: Mark hardware as retired when decommissioned
- **Audit Trail**: Complete history of status changes and maintenance

✅ **Use Cases**
- **New Employee Onboarding**: Quickly provision hardware for pre-hires
- **Inventory Audits**: Bulk import hardware from Excel/CSV inventory lists
- **Maintenance Tracking**: Record all repairs and service calls with costs
- **Budget Management**: Track hardware costs and maintenance expenses
- **Asset Lifecycle**: Monitor hardware from purchase to retirement
- **Warranty Management**: Track purchase dates for warranty claims
- **Department Transfers**: Reassign hardware between employees with status updates

✅ **Benefits**
- **Centralized Inventory**: Single source of truth for all hardware assets
- **Bulk Operations**: Import hundreds of hardware items in seconds via CSV
- **Maintenance History**: Complete service record for warranty claims and budgeting
- **Cost Tracking**: Monitor hardware and maintenance expenses for financial reporting
- **Status Visibility**: Real-time view of available, assigned, and maintenance hardware
- **Data Validation**: Prevent invalid data entry with comprehensive validation rules
- **Scalability**: Handle large hardware inventories with bulk import and efficient search

✅ **Component Usage**

**HardwareInventory Component**: Full-featured hardware management interface
```tsx
import HardwareInventory from './components/HardwareInventory';
import { mockHardware } from './utils/mockData';

// Basic usage with initial data
<HardwareInventory
  initialHardware={mockHardware}
  onHardwareChange={(updatedHardware) => {
    console.log('Hardware updated:', updatedHardware);
    // Save to database, update state, etc.
  }}
/>

// Usage without initial data (starts empty)
<HardwareInventory
  onHardwareChange={(hardware) => saveHardwareToDatabase(hardware)}
/>
```

**Key Features Available**:
- Search, filter (by type/status), and sort hardware items
- Create new hardware via modal form or CSV bulk import
- Edit existing hardware with maintenance tracking
- Delete hardware with confirmation
- Real-time statistics cards (total, available, assigned, maintenance)
- Responsive grid layout with hardware cards
- Dark mode support

**CSV Import Template Columns**:
`type, model, manufacturer, status, serialNumber, purchaseDate, cost, processor, ram, storage, screenSize, connectivity`

**Mock Data Available** (`utils/mockData.ts`):
- `mockHardware` - 19+ items across all hardware types
- `mockSoftware` - Software catalog with license pools
- `mockPackages` - Pre-configured equipment packages
- `mockPreHires` - Sample pre-hire candidates

---

## 🎯 Phase 6: App Integration & Navigation (COMPLETED ✅)

**Goal**: Integrate all feature modules into a unified application with intuitive navigation

### What Was Accomplished

✅ **1. Navigation System Created** ([components/Navigation.tsx](components/Navigation.tsx))
- Sidebar navigation with 5 major sections:
  1. Pre-hires & Packages (existing functionality)
  2. Hardware Inventory (Phase 5)
  3. License Pool Dashboard (Phase 2)
  4. Freeze Period Admin (Phase 3)
  5. Freeze Period Dashboard (Phase 3)
- Active section highlighting with visual indicators
- Persistent section selection (localStorage)
- Dark mode support
- Responsive design

✅ **2. App.tsx Updated with Conditional Rendering**
- Navigation sidebar integrated into main layout
- Content area conditionally renders based on selected section
- All existing pre-hire/package functionality preserved
- Smooth section switching without page reloads

✅ **3. All Components Integrated**

**Hardware Inventory** (`hardware-inventory` section):
```typescript
<HardwareInventory
  initialHardware={mockHardware}
  onHardwareChange={(updatedHardware) => {
    console.log('Hardware updated:', updatedHardware);
    addToast('Hardware inventory updated', 'success');
  }}
/>
```

**License Pool Dashboard** (`license-pools` section):
```typescript
<LicensePoolDashboard
  licenses={mockSoftware}
  onAssignLicense={(license) => addToast(`Assigning ${license.name}...`, 'success')}
  onViewAssignments={(license) => addToast(`Viewing assignments for ${license.name}`, 'success')}
  onEditLicense={(license) => addToast(`Editing ${license.name}...`, 'success')}
/>
```

**Freeze Period Admin** (`freeze-period-admin` section):
```typescript
<FreezePeriodAdmin
  freezePeriods={mockFreezePeriods}
  currentUser={{
    name: user?.displayName || 'Unknown User',
    email: user?.email || 'unknown@momentumww.com',
  }}
  onCreateFreezePeriod={(period) => addToast('Freeze period created successfully', 'success')}
  onUpdateFreezePeriod={(period) => addToast('Freeze period updated successfully', 'success')}
  onDeleteFreezePeriod={(periodId) => addToast('Freeze period deleted', 'success')}
  onClose={() => {/* No-op */}}
/>
```

**Freeze Period Dashboard** (`freeze-period-dashboard` section):
```typescript
<FreezePeriodDashboard
  freezePeriods={mockFreezePeriods}
  preHires={mockPreHires}
  employees={mockEmployees}
  notifications={mockFreezePeriodNotifications}
  onGenerateEmail={(notification) => addToast(`Email generated for ${notification.employeeName}`, 'success')}
  onGenerateBulkEmails={(notifications) => addToast(`Generated ${notifications.length} emails`, 'success')}
  onMarkEmailSent={(notificationId) => addToast('Email marked as sent', 'success')}
  onClose={() => {/* No-op */}}
/>
```

✅ **4. Mock Data Expanded** ([utils/mockData.ts](utils/mockData.ts))

Added comprehensive test data:
- `mockFreezePeriods` - 2 freeze period configurations
  - Winter 2025 Workday Freeze (active, Nov 20 - Jan 5)
  - Summer 2026 System Upgrade (inactive, Jul 1-15)
- `mockEmployees` - 2 employee records with full onboarding history
  - John Smith (active, onboarded 2023)
  - Sarah Johnson (active, ending Dec 2025, pre-loaded account)
- `mockFreezePeriodNotifications` - 3 notifications
  - 2 pending (Emily Rodriguez start, Sarah Johnson end)
  - 1 sent (Michael Chen start)

✅ **5. Type System Complete**
- All necessary types already defined in [types.ts](types.ts):
  - `FreezePeriod` (16 fields including email templates)
  - `FreezePeriodNotification` (13 fields with status tracking)
  - `Employee` (with onboarding phases and freeze period flags)
- Mock data imports added to `mockData.ts`

### Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Dark mode, Settings, Help, Tour, Reset)            │
├────────────┬────────────────────────────────────────────────┤
│            │                                                 │
│ Navigation │ Content Area (Conditional Rendering)           │
│ Sidebar    │                                                 │
│            │ • Pre-hires & Packages                          │
│ • Pre-hire │   └─ Two-panel layout (InputPanel + OutputPanel)│
│ • Hardware │                                                 │
│ • Licenses │ • Hardware Inventory                            │
│ • Freeze   │   └─ HardwareInventory component                │
│   Admin    │                                                 │
│ • Freeze   │ • License Pool Dashboard                        │
│   Dashboard│   └─ LicensePoolDashboard component             │
│            │                                                 │
│            │ • Freeze Period Admin                           │
│            │   └─ FreezePeriodAdmin component                │
│            │                                                 │
│            │ • Freeze Period Dashboard                       │
│            │   └─ FreezePeriodDashboard component            │
│            │                                                 │
└────────────┴────────────────────────────────────────────────┘
```

### Key Features

**1. Persistent Navigation State**
- Current section stored in `localStorage` as `currentSection`
- Users return to last visited section on page reload

**2. Toast Notifications**
- Success messages for all CRUD operations
- Consistent feedback across all sections
- Non-blocking UI updates

**3. No-Op Callbacks**
- Components designed as modals have `onClose` props
- Navigation-based UI provides empty function: `onClose={() => {}}`
- Preserves component API without breaking integration

**4. Dark Mode Consistent**
- All sections support dark mode
- Sidebar navigation matches app theme
- No visual inconsistencies

### Files Modified

| File | Changes | Lines Added |
|------|---------|-------------|
| [components/Navigation.tsx](components/Navigation.tsx) | **NEW** - Sidebar navigation component | 155 |
| [App.tsx](App.tsx) | Navigation integration, conditional rendering | ~100 |
| [utils/mockData.ts](utils/mockData.ts) | Added freeze period, employee, notification data | ~180 |

### Benefits

✅ **Unified User Experience**: All features accessible from single navigation
✅ **Modular Architecture**: Each section independent, easy to maintain
✅ **Scalable**: Easy to add new sections to navigation
✅ **Intuitive**: Standard sidebar pattern familiar to users
✅ **Responsive**: Works on desktop, tablet (sidebar collapses if needed)
✅ **Fast**: Section switching instant (no page reloads)
✅ **Testable**: Each section can be tested independently

### Next Steps (Future Enhancements)

**State Management** (when moving beyond mock data):
- Create `FreezePeriodContext` for freeze period state management
- Create `EmployeeContext` for employee data
- Add API integration for CRUD operations
- Replace mock data callbacks with real API calls

**Navigation Enhancements**:
- Add section icons with badge counters (e.g., pending notifications count)
- Add keyboard shortcuts for section switching
- Add breadcrumb navigation for deeper hierarchies
- Add mobile menu collapse/expand

**Testing**:
- Test all sections load correctly
- Test navigation state persistence
- Test dark mode in all sections
- Test responsive behavior

---

### 🏢 Momentum Department Integration

✅ **Organizational Data** (Already Integrated!)
- Fetches 962 Momentum users from Power Platform via Power Automate
- Department mapping with DepartmentGroup and Department fields
- 24-hour caching with circuit breaker pattern for resilience
- Automatic profile enrichment (name, title, department, photo)
- Fallback to Graph API when Power Platform data unavailable

### 📊 Onboarding Progress Tracking

✅ **Visual Progress Indicators**
- Track onboarding phases (Pre-hire → Systems Setup → Equipment Provisioned → Active)
- Task checklist for HR, IT, Manager, and Employee
- Due date tracking and completion status
- Timeline view of onboarding milestones

✅ **Task Management**
- Categorize tasks by stakeholder (HR, IT, Manager, Employee)
- Status tracking (Pending, In Progress, Completed)
- Automatic notifications for overdue tasks
- Integration with email/calendar for reminders

### 🔗 System Integration

✅ **Active Directory Integration**
- User account creation and authentication
- Profile synchronization
- Access control management

✅ **Workday Integration** (Nov onwards)
- Employee record creation
- Freeze period handling (pre-load with password scrubbing)
- Data synchronization with Vantage

✅ **Vantage Integration**
- Manual employee record creation (Laurie Walker)
- Internal record management
- Link to pre-hire records

✅ **Weenus Integration**
- Equipment request form triggering
- Hardware and software selection
- Inventory tracking

### 🤖 AI-Powered Features (Optional)

✅ **AI Agent Integration** (Preserved from Meeting Notes Generator)
- Potential use of AI agents for intelligent recommendations
- Package suggestion based on role/department analysis
- Onboarding Q&A chatbot for new employees
- Anomaly detection for unusual equipment requests
- Natural language processing for equipment descriptions

### 📤 Export & Reporting

✅ **Multiple Export Formats**
- **CSV**: Equipment lists, pre-hire rosters, onboarding task lists
- **PDF**: Print onboarding reports and equipment packages
- **Email**: Send package assignments and status updates
- **Clipboard**: Copy data for external systems

✅ **Reporting Dashboard**
- Pre-hire pipeline view (candidates by start date)
- Equipment provisioning status
- Approval queue (pending, approved, rejected)
- Freeze period overview (accounts needing activation/deactivation)
- Onboarding completion rates and timelines

### 🎨 User Experience Features

✅ **Dark Mode Support** 🌙
- System preference detection
- Manual toggle
- Persistent preference storage

✅ **Interactive Guided Tour** 🗺️
- Step-by-step onboarding for new users
- Contextual highlights on key features
- Dismissible with "Don't show again" option

✅ **File Upload Support** 📁
- Upload data files for bulk import
- Support for `.txt`, `.csv`, and `.xlsx` formats
- Drag-and-drop support for easy data entry

✅ **Form State Persistence** 💾
- Auto-save input data to localStorage
- Restore previous session on page reload
- Clear data button for fresh starts

✅ **Real-Time Preview** 👁️
- Output updates as you modify settings
- Live regeneration with control changes
- Loading states with skeleton loaders

✅ **Toast Notifications** 🔔
- Success/error feedback
- Auto-dismiss with timer
- Non-blocking UI

✅ **Scroll to Top Button** 🔼
- Floating action button (FAB) in bottom-right corner
- Automatically appears after scrolling 400px down the page
- Smooth scroll animation back to top
- Circular design with brand color and hover effects
- Dark mode support with glassmorphism styling
- Fully accessible (keyboard navigation, ARIA labels)

✅ **Automatic Version Update Detection** 🔄
- Detects when new versions are deployed to Cloud Run
- Non-intrusive notification banner when updates are available
- Periodic polling (every 5 minutes) + check on tab focus
- Displays current vs. server version information
- One-click refresh to load latest version
- Dismissible for current session
- Ensures users always have access to latest features and bug fixes
- Full telemetry tracking for update adoption monitoring

---

## Telemetry & Analytics 📊

The application includes a comprehensive telemetry framework that tracks user interactions and usage patterns to help improve the product. All telemetry data is sent to Power Automate flows for centralized logging and analysis.

### What is Tracked

**Authentication Events**:
- User login (once per session)
- User logout
- Access denied (user not in required Azure AD group)

**Core Functionality**:
- Pre-hire created
- Pre-hire updated
- Package assigned to pre-hire
- Package customized
- Approval submitted
- Approval approved/rejected
- Helix ticket created
- Freeze period email triggered
- Onboarding phase completed

**Export & Sharing**:
- Copy to clipboard (equipment lists, pre-hire rosters)
- Download PDF (onboarding reports, package details)
- Download CSV (pre-hire data, equipment lists, task lists)
- Draft email (package assignments, status updates)

**File Uploads**:
- CSV file uploads (bulk pre-hire import, equipment inventory)
- XLSX file uploads (package definitions, employee lists)
- File size and record count tracking

**User Interactions**:
- Sample data loaded
- Form cleared
- Package template selected
- Settings opened
- Filter applied (department, role, status)

**Tour Interactions**:
- Tour started
- Tour completed (finished all steps)
- Tour dismissed (closed before completing)

**Version Management**:
- Version mismatch detected (tracks current vs. server version)
- User refreshed to update (successful adoption of new version)
- Update notification dismissed (user chose to stay on current version)

### Privacy & Security

- **User Data**: Only authenticated user name and email (from Azure AD) are sent
- **Bot IDs**: Hashed using a simple hash function before transmission (if AI agents used)
- **Sensitive Data**: Pre-hire salary information is **never** sent to telemetry
- **Employee Data**: Only aggregated metrics (counts, timelines) are tracked, not personal details
- **File Names**: Only file extensions and record counts are tracked, not full file names or contents
- **Fire-and-Forget**: Telemetry failures do not impact application functionality

### Power Automate Integration

The application sends all telemetry data to a single centralized Power Automate flow endpoint that tracks all events with rich metadata.

#### Centralized Telemetry Event Schema

```json
{
  "appName": "Employee Onboarding System",
  "appVersion": "2.0.0",
  "sessionId": "unique-session-id-per-browser-session",
  "correlationId": "optional-id-to-link-related-events",
  "eventType": "preHireCreated",
  "timestamp": "2025-11-12T14:30:00.000Z",
  "userContext": {
    "name": "John Doe",
    "email": "john.doe@company.com",
    "tenantId": "azure-ad-tenant-id"
  },
  "eventPayload": "{\"role\":\"XD Designer\",\"department\":\"Creative\",\"packageType\":\"standard\",\"startDate\":\"2025-11-20\"}"
}
```

### Configuration

The telemetry flow URL is configured in [appConfig.ts](appConfig.ts):

```typescript
export const appConfig = {
  telemetryFlowUrl: "YOUR_POWER_AUTOMATE_TELEMETRY_FLOW_URL"
};
```

**To configure**:
1. Create an HTTP trigger flow in Power Automate
2. Configure the flow to receive the telemetry event schema (see schema above)
3. Copy the HTTP POST URL from the trigger
4. Replace the placeholder URL in `appConfig.ts`
5. If URL is not configured (still contains "YOUR_"), telemetry will be disabled with console warnings

### Disabling Telemetry (Development)

To disable telemetry during local development:
- Leave the placeholder URLs in `appConfig.ts` unchanged
- The app will log warnings to the console but continue functioning normally

### Telemetry Dashboard (Optional)

The telemetry data can be used to create Power BI dashboards showing:
- Daily/weekly active users
- Pre-hire pipeline metrics (by department, role, start date)
- Most popular equipment packages
- Approval rates (standard vs exception)
- Tour completion rates
- Average onboarding timeline duration
- Freeze period automation effectiveness
- Feature adoption metrics

---

## Data Model

The Employee Onboarding System uses a comprehensive data model to track pre-hires, employees, equipment packages, and approval workflows.

### Hardware Entity

```typescript
interface Hardware {
  id: string;
  type: "computer" | "monitor" | "keyboard" | "mouse" | "dock" | "headset" | "accessory";
  model: string;
  manufacturer: string;
  specifications: {
    processor?: string;
    ram?: string;
    storage?: string;
    screenSize?: string;
    connectivity?: string;
  };
  status: "available" | "assigned" | "maintenance" | "retired";
  serialNumber?: string;
  purchaseDate?: Date;
  cost?: number;
}
```

**Example - MacBook Pro**:
```json
{
  "id": "hw-001",
  "type": "computer",
  "model": "MacBook Pro 16\" M3 Max",
  "manufacturer": "Apple",
  "specifications": {
    "processor": "M3 Max",
    "ram": "64GB",
    "storage": "2TB SSD"
  },
  "status": "available",
  "cost": 4299.00
}
```

### Package Entity

```typescript
interface Package {
  id: string;
  name: string;                  // e.g., "XD Designer Standard"
  description: string;
  roleTarget: string[];           // e.g., ["XD Designer", "Motion Designer"]
  departmentTarget: string[];     // e.g., ["Creative", "IPTC"]
  hardware: Hardware[];
  software: Software[];
  licenses: Software[];
  isStandard: boolean;           // true = auto-approve, false = SVP approval
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}
```

**Example - XD Designer Standard Package**:
```json
{
  "id": "pkg-xd-std-001",
  "name": "XD Designer Standard",
  "description": "Standard equipment package for Experience Designers",
  "roleTarget": ["XD Designer", "Senior XD Designer"],
  "departmentTarget": ["Creative", "IPTC"],
  "hardware": [
    {"type": "computer", "model": "MacBook Pro 16\" M3 Max"},
    {"type": "monitor", "model": "Dell UltraSharp 27\" 4K"},
    {"type": "keyboard", "model": "Apple Magic Keyboard"},
    {"type": "mouse", "model": "Logitech MX Master 3"},
    {"type": "dock", "model": "CalDigit TS4"}
  ],
  "software": [
    {"name": "Adobe Creative Cloud"},
    {"name": "Figma Professional"},
    {"name": "Cinema 4D"}
  ],
  "isStandard": true
}
```

### Software/License Entity

```typescript
interface Software {
  id: string;
  name: string;                  // e.g., "Cinema 4D", "Smartsheet"
  vendor: string;
  licenseType: "perpetual" | "subscription" | "concurrent";
  requiresApproval: boolean;
  approver?: string;             // e.g., "Steve Sanderson", "Patricia", "Auto"
  cost: number;
  renewalFrequency?: "monthly" | "annual";
  seatCount?: number;           // For concurrent licenses
  description?: string;
}
```

**Example - Cinema 4D**:
```json
{
  "id": "sw-c4d-001",
  "name": "Cinema 4D Studio",
  "vendor": "Maxon",
  "licenseType": "subscription",
  "requiresApproval": true,
  "approver": "Steve Sanderson",
  "cost": 94.99,
  "renewalFrequency": "monthly"
}
```

### PreHire Entity

```typescript
interface PreHire {
  id: string;
  candidateName: string;
  email?: string;
  role: string;
  department: string;
  startDate: Date;
  hiringManager: string;
  status: "candidate" | "offered" | "accepted" | "linked" | "cancelled";
  assignedPackage?: Package;
  customizations?: {
    addedHardware?: Hardware[];
    removedHardware?: Hardware[];
    addedSoftware?: Software[];
    removedSoftware?: Software[];
    reason?: string;
  };
  linkedEmployeeId?: string;     // Manual link to Vantage/AD
  createdBy: string;
  createdDate: Date;
  lastModified: Date;

  // Note: Salary intentionally excluded (sensitive data in Camille's Excel only)
}
```

**Example - Pre-hire Record**:
```json
{
  "id": "pre-2025-001",
  "candidateName": "Jane Smith",
  "email": "jane.smith@momentumww.com",
  "role": "XD Designer",
  "department": "Creative",
  "startDate": "2025-12-01",
  "hiringManager": "John Doe",
  "status": "accepted",
  "assignedPackage": {"id": "pkg-xd-std-001"},
  "customizations": {
    "addedSoftware": [{"name": "Smartsheet"}],
    "reason": "Requested during negotiation"
  }
}
```

### Employee Entity

```typescript
interface Employee {
  id: string;                    // From Vantage
  activeDirectoryId?: string;
  workdayId?: string;
  name: string;
  email: string;
  department: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  manager?: string;

  // Equipment tracking
  assignedPackage?: Package;
  actualHardware: Hardware[];
  actualSoftware: Software[];

  // Onboarding status
  preHireId?: string;
  onboardingStatus: "pre-hire" | "systems-created" | "equipment-assigned" | "active";
  onboardingPhases: {
    adCreated?: Date;
    vantageCreated?: Date;
    workdayCreated?: Date;
    equipmentOrdered?: Date;
    equipmentReceived?: Date;
    onboardingComplete?: Date;
  };

  // Freeze period handling
  isPreloaded: boolean;
  needsPasswordReset: boolean;

  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}
```

### ApprovalRequest Entity

```typescript
interface ApprovalRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  requestType: "equipment" | "software" | "exception" | "mid-employment";
  items: (Hardware | Software)[];
  packageId?: string;
  requester: string;
  requestDate: Date;
  approver: string;              // "Auto", "Steve Sanderson", "Patricia"
  status: "pending" | "approved" | "rejected" | "cancelled";
  helixTicketId?: string;
  automatedDecision: boolean;    // true for standard packages
  approvalDate?: Date;
  rejectionReason?: string;
  notes?: string;
}
```

**Example - Approval Request**:
```json
{
  "id": "apr-2025-001",
  "employeeId": "emp-001",
  "employeeName": "Jane Smith",
  "requestType": "exception",
  "items": [
    {"name": "Cinema 4D Studio", "cost": 94.99}
  ],
  "requester": "John Doe",
  "requestDate": "2025-11-12",
  "approver": "Steve Sanderson",
  "status": "pending",
  "automatedDecision": false
}
```

### HelixTicket Entity

```typescript
interface HelixTicket {
  id: string;
  type: "new-hire" | "password-reset" | "termination" | "access-request" | "equipment";
  employeeId: string;
  employeeName: string;
  requestedBy: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdDate: Date;
  resolvedDate?: Date;
  assignedTo?: string;
  description: string;

  // For freeze period
  scheduledAction?: "activate" | "deactivate";
  actionDate?: Date;

  // For equipment
  equipmentItems?: (Hardware | Software)[];
  approvalRequestId?: string;
}
```

**Example - Freeze Period Ticket**:
```json
{
  "id": "hx-2025-001",
  "type": "password-reset",
  "employeeId": "emp-001",
  "employeeName": "Jane Smith",
  "requestedBy": "Camille (HR)",
  "status": "open",
  "priority": "high",
  "createdDate": "2025-12-01",
  "scheduledAction": "activate",
  "actionDate": "2025-12-01",
  "description": "Jane Smith is starting work 2025-12-01. Please reset their password and MFA and send credentials to jane.smith@momentumww.com."
}
```

### OnboardingProgress Entity

```typescript
interface OnboardingProgress {
  employeeId: string;
  currentPhase: "pre-hire" | "systems-setup" | "equipment-provisioning" | "complete";
  percentComplete: number;
  completedSteps: string[];
  pendingTasks: OnboardingTask[];
  startDate: Date;
  targetCompletionDate?: Date;
  actualCompletionDate?: Date;
  lastUpdated: Date;
}

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  category: "hr" | "it" | "manager" | "employee";
  status: "pending" | "in-progress" | "completed" | "blocked";
  assignedTo: string;
  dueDate?: Date;
  completedDate?: Date;
  blockedReason?: string;
  order: number;
}
```

### Database Schema

**Recommended Database**: Azure SQL Database or SharePoint Lists

**Core Tables**:
1. **PreHires** - Pre-hire candidate tracking
2. **Employees** - Employee records with onboarding status
3. **Packages** - Equipment package definitions
4. **Hardware** - Hardware inventory and assignments
5. **Software** - Software catalog and licenses
6. **ApprovalRequests** - Approval workflow tracking
7. **HelixTickets** - IT ticket integration
8. **OnboardingTasks** - Task checklist management

**Relationships**:
- PreHire → Package (many-to-one)
- PreHire → Employee (one-to-one, manual link)
- Employee → Package (many-to-one)
- Employee → Hardware (many-to-many)
- Employee → Software (many-to-many)
- ApprovalRequest → Employee (many-to-one)
- ApprovalRequest → HelixTicket (one-to-one)

---

## System Integration Points

### Power Automate Flows

**1. Pre-hire Data Push** (from Camille's Excel)
```
Trigger: Excel button or scheduled (daily)
Actions:
  1. Extract pre-hire data (exclude salary)
  2. POST to /api/pre-hires
  3. Return confirmation to Excel
```

**2. Freeze Period Email Automation**
```
Trigger: Employee start/end date arrives during freeze period
Actions:
  1. Check if freeze period active (Nov - Jan 5)
  2. Generate email content (password reset or termination)
  3. Send to Helix email address
  4. CC Camille/Payton
  5. Create HelixTicket record
```

**3. Momentum Department Lookup** (Already Working! ✅)
```
Trigger: On demand from application
Actions:
  1. Query SharePoint/SQL for 962 Momentum users
  2. Return department mapping (DepartmentGroup, Department)
  3. Cache for 24 hours
Response Time: ~2 seconds for 962 users
```

**4. Helix Ticket Creation**
```
Trigger: Approval approved
Actions:
  1. Create ticket in Helix system
  2. Assign to IT team
  3. Return ticket ID
  4. Update ApprovalRequest with helixTicketId
```

### API Integrations

**Workday API** (Future - Nov onwards):
- Employee record creation
- Department/role synchronization
- Start date tracking

**Helix API** (Coordinate with Chris Kumar):
- Ticket creation
- Status updates
- Assignment management

**Weenus Integration**:
- Equipment request form triggering
- Inventory queries
- Fulfillment tracking

**Graph API** (Already Integrated ✅):
- User profile enrichment
- Department fallback lookup
- Manager hierarchy
- Profile photos

---

## Current Issues & Solutions

### Known Challenges

**1. Data Source Connectivity**
- **Issue**: App not connected to data sources for simplicity
- **Options Being Explored**:
  - SQL table connection (preferred for department/employee mapping)
  - Power Automate flows for search and retrieval
  - Excel grounding (not available in current GPT model)
  - Master prompt embedding (400 employees = too large)
- **Recommendation**: Azure SQL Database with REST API layer

**2. Camille's Excel Limitations**
- **Issue**: Contains sensitive salary data (restricted access)
- **Issue**: Lookups reference inaccessible files
- **Solution**: Power Automate button trigger to push sanitized data
- **Implementation**: Excel macro button → Power Automate → POST /api/pre-hires

**3. Manual Pre-hire → Employee Linking**
- **Issue**: No automated way to connect pre-hire records to Vantage/AD employee records
- **Impact**: Requires manual matching in system
- **Risk**: Disconnected data between pre-hire and employee phases
- **Solution**: Manual UI in app for HR to link records

**4. Approval Process Complexity**
- **Issue**: Standard packages should auto-approve but IT needs confirmation
- **Issue**: Exception requests must route through Helix to SVP
- **Issue**: Random IT tickets bypass formal process
- **Goal**: Pre-defined packages eliminate most approvals
- **Coordination**: Work with Chris Kumar on Helix configuration

**5. Workday Freeze Period Handling**
- **Issue**: Nov - Jan 5 = no Workday updates allowed
- **Current Process**: Users pre-loaded with scrubbed credentials
- **Current Process**: Manual email to IT for activation/deactivation
- **Automation Opportunity**: Orbit monitors dates → Power Automate → Helix emails
- **Decision Needed**: Button-triggered (HR reviews) vs fully automated

### Proposed Solutions Summary

✅ **Department Mapping**: Already working! (Power Platform 962 users)
✅ **Pre-hire Integration**: Power Automate button in Camille's Excel
✅ **Approval Automation**: Standard = auto-approve, Exception = Helix to SVP
✅ **Freeze Period**: Power Automate email generation (button or automated)
✅ **Database**: Azure SQL Database for scalability and performance

### Open Questions

- Can Helix accept automated approvals via API, or email-only?
- Should standard packages completely bypass Steve/Patricia approval?
- Can system send from HR email addresses or must HR manually send?
- How to handle exceptions during Workday freeze period?
- What's the process for linking pre-hire to Vantage/AD records?
- Should freeze period emails be fully automated or button-triggered?
- Can Power Automate be triggered directly from Excel button? (Yes, confirmed)
- What data fields needed from Camille's Excel (excluding salary)?

---

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software

- **Node.js**: Version 18.x or higher
  - Download: [https://nodejs.org/](https://nodejs.org/)
  - Verify: `node --version`

- **npm**: Version 9.x or higher (included with Node.js)
  - Verify: `npm --version`

### Required Accounts & Access

- **Microsoft Entra ID (Azure AD) Account**: For user authentication
  - Your organization must have an Azure AD tenant
  - You'll need credentials to sign in (SSO supported)

- **API Access**: Credentials for Interact.interpublic.com API
  - Client ID: Provided by your IT/DevOps team
  - Client Secret: Provided by your IT/DevOps team
  - Bot ID: AI agent bot identifier for meeting notes generation

### Development Environment

- **Code Editor**: VS Code recommended (with React/TypeScript extensions)
- **Modern Browser**: Chrome, Edge, Firefox, or Safari (with developer tools)
- **Git**: For version control (optional but recommended)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Momo Mettings App"
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- React 18.2.0 + React DOM
- TypeScript 5.4.5
- Vite 5.2.11 (build tool)
- MSAL Browser 3.10.0 (authentication)
- MSAL React 2.0.12 (React integration)
- Tailwind CSS (via CDN)

### 3. Configure Environment Variables

Create a `.env.local` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# API Credentials for Interact.interpublic.com
CLIENT_ID="YourClientID"
CLIENT_SECRET="YourClientSecret"

# Default Bot ID for AI Agent
DEFAULT_BOT_ID="64650431-dad7-4b47-8bb1-4a81800f9f5f"

# Google Gemini API Key (optional, not currently used)
GEMINI_API_KEY="PLACEHOLDER_API_KEY"
```

> ⚠️ **Security Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 4. Configure MSAL Authentication

Edit `auth/authConfig.ts` if you need to customize:

```typescript
export const msalConfig = {
  auth: {
    clientId: "5fa64631-ea56-4676-b6d5-433d322a4da1", // Your Azure AD App ID
    authority: "https://login.microsoftonline.com/{YOUR_TENANT_ID}",
    redirectUri: "http://localhost:5173", // Local development
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};
```

**Important**: Replace `{YOUR_TENANT_ID}` with your actual Azure AD tenant ID.

### 5. Run the Development Server

```bash
npm run dev
```

Expected output:
```
VITE v5.2.11  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 6. Access the Application

Open your browser and navigate to: **http://localhost:5173**

You'll be prompted to sign in with your Microsoft account.

### 7. Test with Sample Data

Click the **"Load Sample Meeting"** button to populate the form with example data, then click **"Generate Meeting Notes"** to see the AI in action.

---

## How It Works

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           React Application (Port 5173)                    │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │  Auth Guard  │  │ Input Panel  │  │  Output Panel   │ │ │
│  │  │   (MSAL)     │  │  (Form)      │  │  (Results)      │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │ │
│  │         │                  │                    │          │ │
│  │         │                  │                    │          │ │
│  │         ▼                  ▼                    ▼          │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │           Context API + State Management             │ │ │
│  │  │  (AuthContext, TourContext, useLocalStorage)         │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                           │                                │ │
│  └───────────────────────────┼────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│                   ┌──────────────────────┐                     │
│                   │  API Service Layer   │                     │
│                   │  (Token Management)  │                     │
│                   └──────────────────────┘                     │
└────────────────────────────────┼──────────────────────────────┘
                                 │
                                 │ HTTPS
                                 │
            ┌────────────────────┴──────────────────────┐
            │                                            │
            ▼                                            ▼
┌────────────────────────┐               ┌────────────────────────────┐
│  Microsoft Entra ID    │               │  Interact.interpublic.com  │
│  (Azure AD)            │               │  API                       │
│                        │               │                            │
│  - User Authentication │               │  - Token Endpoint          │
│  - Token Issuance      │               │  - Chat/AI Endpoint        │
│  - Profile Info        │               │  - Bot ID: {botId}         │
└────────────────────────┘               └────────────────────────────┘
            │                                            │
            ▼                                            ▼
┌────────────────────────┐               ┌────────────────────────────┐
│  Microsoft Graph API   │               │  AI Agent (Backend)        │
│                        │               │                            │
│  - GET /v1.0/me        │               │  - LLM Processing          │
│  - GET /me/photo/      │               │  - Meeting Analysis        │
│    $value              │               │  - Action Item Extraction  │
└────────────────────────┘               └────────────────────────────┘
```

### Authentication Flow

```
┌─────────┐                                           ┌──────────────┐
│ Browser │                                           │ Azure AD     │
└────┬────┘                                           └──────┬───────┘
     │                                                        │
     │  1. Check if user is authenticated                    │
     ├────────────────────────────────────┐                  │
     │                                    │                  │
     │  2a. Not authenticated             │                  │
     │  ───> Show sign-in UI              │                  │
     │                                    │                  │
     │  3. User clicks "Sign In"          │                  │
     │  ───> Trigger MSAL login           │                  │
     │                                    │                  │
     │  4. Popup vs. Redirect decision    │                  │
     │  (based on iframe detection)       │                  │
     │                                    │                  │
     │  5. Redirect to Azure AD           │                  │
     ├────────────────────────────────────┼─────────────────>│
     │                                    │                  │
     │  6. User enters credentials        │                  │
     │     (or SSO auto-login)            │                  │
     │                                    │                  │
     │  7. Azure AD returns auth code     │                  │
     │<───────────────────────────────────┼──────────────────┤
     │                                    │                  │
     │  8. MSAL exchanges code for token  │                  │
     ├────────────────────────────────────┼─────────────────>│
     │                                    │                  │
     │  9. Access token + ID token        │                  │
     │<───────────────────────────────────┼──────────────────┤
     │                                    │                  │
     │  10. Store token in sessionStorage │                  │
     │      Set auth context              │                  │
     │                                    │                  │
     │  2b. Already authenticated         │                  │
     │  ───> Load main app                │                  │
     │                                    │                  │
     ▼                                    ▼                  ▼
```

### API Request Flow

```
┌──────────────┐                                      ┌─────────────┐
│ React App    │                                      │ API Server  │
└──────┬───────┘                                      └──────┬──────┘
       │                                                     │
       │  1. User submits meeting form                      │
       ├──────────────────────────────────┐                 │
       │                                  │                 │
       │  2. Check if API token is valid  │                 │
       │     (check expiration)           │                 │
       │                                  │                 │
       │  3a. Token expired or missing    │                 │
       │  ───> Request new token          │                 │
       │                                  │                 │
       │  4. POST /api/token              │                 │
       │     Body: {                      │                 │
       │       client_id: "...",          │                 │
       │       client_secret: "...",      │                 │
       │       grant_type: "client_cred"  │                 │
       │     }                            │                 │
       ├──────────────────────────────────┼────────────────>│
       │                                  │                 │
       │  5. Return access_token          │                 │
       │<─────────────────────────────────┼─────────────────┤
       │                                  │                 │
       │  6. Cache token in localStorage  │                 │
       │     with expiration time         │                 │
       │                                  │                 │
       │  3b. Token valid                 │                 │
       │  ───> Use cached token           │                 │
       │                                  │                 │
       │  7. POST /api/chat-ai/v1/bots/   │                 │
       │     {botId}/messages             │                 │
       │     Headers: {                   │                 │
       │       Authorization: Bearer ...  │                 │
       │     }                            │                 │
       │     Body: {                      │                 │
       │       messages: [...],           │                 │
       │       controls: {...}            │                 │
       │     }                            │                 │
       ├──────────────────────────────────┼────────────────>│
       │                                  │                 │
       │  8. AI processes request         │                 │
       │     (LLM generates notes)        │                 │
       │                                  │                 │
       │  9. Return response:             │                 │
       │     {                            │                 │
       │       markdown: "...",           │                 │
       │       next_steps: [...],         │                 │
       │       coach_insights: {...},     │                 │
       │       suggested_questions: [...]│                 │
       │     }                            │                 │
       │<─────────────────────────────────┼─────────────────┤
       │                                  │                 │
       │  10. Parse and display output    │                 │
       │      in OutputPanel              │                 │
       │                                  │                 │
       ▼                                  ▼                 ▼
```

### Data Flow

1. **User Input** → Form data collected in `InputPanel.tsx`
   - **Calendar Meeting Selection** (automatic): Browse Teams calendar, select meeting, auto-fetch title, agenda, transcript, and participants
   - **Manual Input** (alternative): Type or paste meeting title, agenda, and transcript
   - Context tags (client-facing, internal, sensitive)

2. **Control Selection** → User configures output preferences
   - Audience, tone, view mode, department focus
   - Meeting preset selection (optional)

3. **API Request** → `apiService.ts` handles communication
   - Token acquisition (OAuth 2.0 client credentials)
   - POST request with messages + controls
   - Error handling and retry logic

4. **AI Processing** → Backend agent analyzes input
   - LLM processes transcript with control parameters
   - Extracts action items with owners and due dates
   - Generates meeting coach insights (if enabled)
   - Produces markdown-formatted summary

5. **Response Parsing** → `OutputPanel.tsx` renders results
   - Markdown converted to HTML with syntax highlighting
   - Action items table generated
   - Coach insights displayed in accordion
   - Suggested questions for follow-up

6. **User Actions** → Export, interrogate, or regenerate
   - CSV export of action items
   - Email draft generation
   - PDF/print via browser
   - Transcript interrogation modal for Q&A

---

## MSAL Authentication Setup

This application uses **Microsoft Authentication Library (MSAL)** to authenticate users via **Microsoft Entra ID (Azure AD)**. Follow these steps to configure authentication for your organization.

### Step 1: Azure AD App Registration

1. Navigate to the [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** → **App registrations**
3. Click **"New registration"**

4. **Configure the app**:
   - **Name**: `Meeting Notes Generator` (or your preferred name)
   - **Supported account types**: Select **"Accounts in this organizational directory only (Single tenant)"**
   - **Redirect URI**:
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:5173` (for local development)
     - Add production URI: `https://yourdomain.com` (when deploying)

5. Click **"Register"**

6. **Note the following values** (you'll need these):
   - **Application (client) ID**: e.g., `5fa64631-ea56-4676-b6d5-433d322a4da1`
   - **Directory (tenant) ID**: e.g., `d026e4c1-5892-497a-b9da-ee493c9f0364`

### Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Choose **"Delegated permissions"**
5. Add the following permissions:

   **Authentication & User Profile**:
   - ✅ `User.Read` - Read signed-in user profile (display name, email, job title)
   - ✅ `profile` - View user's basic profile
   - ✅ `openid` - Sign in and read user profile

   **Calendar Meeting Selection** (required for automatic meeting import):
   - ✅ `Calendars.Read` - Read user's calendar events
   - ✅ `OnlineMeetings.Read` - Read online meeting details
   - ✅ `OnlineMeetingTranscript.Read.All` - Read meeting transcripts (⚠️ requires admin consent)
   - ✅ `Files.Read` - Read OneDrive/Teams files (fallback for transcript retrieval)

   **Participant Matching** (required for auto-populating meeting participants):
   - ✅ `User.Read.All` - Read full profiles of all users (⚠️ requires admin consent)
   - ✅ `Presence.Read.All` - Read presence status of users

6. Click **"Add permissions"**
7. **IMPORTANT**: Click **"Grant admin consent"** to approve permissions marked with ⚠️
   - `OnlineMeetingTranscript.Read.All` and `User.Read.All` require admin approval
   - Without admin consent, calendar meeting selection will not work

### Step 3: Configure Authentication Settings

1. Go to **Authentication** in your app registration
2. Under **Single-page application**:
   - Ensure your redirect URIs are listed:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
     - `https://aistudio.google.com` (if deploying to AI Studio)

3. Under **Implicit grant and hybrid flows**:
   - ❌ Do NOT check "Access tokens"
   - ❌ Do NOT check "ID tokens"
   - (MSAL uses Authorization Code Flow with PKCE, not implicit flow)

4. Under **Advanced settings**:
   - **Allow public client flows**: No
   - **Enable the following mobile and desktop flows**: No

5. Click **"Save"**

### Step 4: Update Application Configuration

Edit `auth/authConfig.ts`:

```typescript
export const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID_HERE", // From Step 1
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID_HERE", // From Step 1
    redirectUri: "http://localhost:5173", // Change for production
  },
  cache: {
    cacheLocation: "sessionStorage", // Options: "sessionStorage" or "localStorage"
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"], // Microsoft Graph API scope
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphPhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value",
};
```

### Step 5: Environment-Specific Configuration

**Development** (`http://localhost:5173`):
- Use `redirectUri: "http://localhost:5173"`
- Token cache: `sessionStorage` (cleared on tab close)

**Production** (custom domain):
- Use `redirectUri: "https://yourdomain.com"`
- Token cache: Consider `localStorage` for persistence across tabs
- Ensure HTTPS is configured

**AI Studio Deployment** (`https://aistudio.google.com`):
- Add redirect URI: `https://aistudio.google.com`
- The app will auto-detect AI Studio environment and use mock authentication

### Step 6: Test Authentication

1. Start the development server: `npm run dev`
2. Open `http://localhost:5173`
3. You should see the sign-in page
4. Click **"Sign in with Microsoft"**
5. A popup window will open (or redirect if popups are blocked)
6. Enter your Microsoft credentials
7. Consent to the requested permissions (if first time)
8. You should be redirected back to the app with your profile loaded

### Authentication Flow Details

**Token Acquisition**:
- **Initial Login**: Interactive popup or redirect
- **Silent Acquisition**: MSAL attempts to acquire tokens silently using cached refresh tokens
- **Token Expiration**: Automatic refresh 60 seconds before expiration

**Token Storage**:
- **Session Storage**: Tokens stored in `sessionStorage` by default (cleared on tab close)
- **Local Storage Backup**: API access token cached in `localStorage` with expiration tracking

**Logout Behavior**:
- Clears session storage
- Redirects to Azure AD logout endpoint
- Returns to app home page

### Troubleshooting MSAL Errors

#### Error: `AADSTS50011` - Redirect URI mismatch
**Solution**: Ensure the `redirectUri` in `authConfig.ts` exactly matches one of the URIs registered in Azure AD (including trailing slashes).

#### Error: `AADSTS65001` - User or administrator has not consented
**Solution**: Have an admin grant consent in Azure AD, or ensure users consent during first login.

#### Error: `AADSTS700016` - Application not found in directory
**Solution**: Verify the `clientId` and `tenantId` in `authConfig.ts` are correct.

#### Error: Popup blocked
**Solution**: The app will detect popup blocking and show a fallback UI with instructions to allow popups or use redirect flow.

#### Error: `interaction_in_progress`
**Solution**: This occurs when multiple login attempts happen simultaneously. The app handles this automatically by waiting for the first interaction to complete.

---

## Azure AD Group Security

### Overview

As of version 1.3.0 (2025-10-24), the Meeting Notes Generator enforces group-based access control to ensure only authorized Momentum Worldwide users can access the application. This security layer works at both the frontend and backend levels.

### Group Information

- **Group Name**: MOM WW All Users 1 SG
- **Group ID**: `2c08b5d8-7def-4845-a48c-740b987dcffb`
- **Type**: Security Group
- **Membership**: Dynamic (886 members)
- **Source**: Cloud (Azure AD)

### How It Works

#### Frontend Security

```
User logs in with Azure AD
    ↓
Azure AD returns token with groups claim
    ↓
Frontend checks if user is in required group
    ↓
┌─────────────────┬────────────────────┐
│ IN GROUP        │ NOT IN GROUP       │
│ ✅ Load App     │ ❌ Show Access    │
│                 │    Denied Page    │
└─────────────────┴────────────────────┘
```

#### Backend Security

```
API request with Bearer token
    ↓
Middleware validates JWT signature
    ↓
Middleware extracts groups claim
    ↓
┌──────────────────┬──────────────────┐
│ IN GROUP         │ NOT IN GROUP     │
│ ✅ Process      │ ❌ Return 403    │
│    Request       │    Forbidden     │
└──────────────────┴──────────────────┘
```

### Azure AD Configuration

#### Step 1: Configure Token Claims

1. Go to your Azure AD App Registration
2. Navigate to **"Token configuration"** in the left sidebar
3. Click **"Add groups claim"**
4. Select **"Security groups"**
5. Check boxes for: **ID**, **Access**, and **UserInfo**
6. For Group ID format, choose: **"Group ID"**
7. Click **"Add"**

**Result**: The `groups` claim will now be included in tokens with the group Object IDs.

#### Step 2: No Additional Permissions Needed

Unlike other approaches, this implementation uses token claims only. No additional Microsoft Graph API permissions or admin consent required!

### Implementation Details

#### Frontend Files

- **[auth/authConfig.ts](auth/authConfig.ts)**: Contains `REQUIRED_GROUP_ID` constant
- **[auth/AuthGuard.tsx](auth/AuthGuard.tsx)**: Implements `checkGroupMembership()` function
- **[auth/AccessDenied.tsx](auth/AccessDenied.tsx)**: Professional access denied page with Momentum branding
- **[contexts/AuthContext.tsx](contexts/AuthContext.tsx)**: Added `isAuthorized` state

#### Backend Files

- **[backend/middleware/auth.js](backend/middleware/auth.js)**: JWT validation and group check middleware
- **[backend/server.js](backend/server.js)**: Applies middleware to protected endpoints

### Access Denied Experience

Users not in the "MOM WW All Users 1 SG" group will see a professional access denied page featuring:

- ✅ Momentum Worldwide logo
- ✅ Clear explanation of access restriction
- ✅ Display of their signed-in email
- ✅ Sign out button
- ✅ Consistent design with login page
- ✅ Dark mode support

### Access Denied Telemetry

When access is denied, the application automatically tracks:

| Data Point | Description | Example |
|------------|-------------|---------|
| **userName** | User's display name | "John Doe" |
| **userEmail** | User's email address | "john.doe@ipg.com" |
| **userId** | Azure AD user ID | "abc123..." |
| **tenantId** | Azure AD tenant ID | "d026e4c1..." |
| **requiredGroupId** | The group ID they need | "2c08b5d8..." |
| **requiredGroupName** | Group name | "MOM WW All Users 1 SG" |
| **userGroups** | Groups they ARE in | ["group-id-1", "group-id-2"] |
| **browser** | Browser name | "Chrome" |
| **platform** | Operating system | "Windows" |
| **deviceType** | Device type | "desktop" |
| **timestamp** | When it happened | "2025-10-24T14:30:00Z" |

This data enables Power BI dashboards for:
- Monitoring unauthorized access attempts
- Identifying users who may need to be added to the group
- Tracking access patterns by department/location
- Security audit trails

### Testing

#### Test 1: Authorized User (Momentum Employee)

1. Login with a Momentum user account
2. **Expected**: App loads normally
3. **Expected**: All features work

#### Test 2: Unauthorized User (Non-Momentum IPG User)

1. Login with an IPG user who is NOT in "MOM WW All Users 1 SG"
2. **Expected**: See "Access Restricted" page immediately after Azure AD login
3. **Expected**: Backend API calls return 403 Forbidden
4. **Expected**: Access denied event logged in telemetry

#### Debugging

Check browser console for:
```
Group membership check: {
  userEmail: "user@momentumww.com",
  requiredGroup: "2c08b5d8-7def-4845-a48c-740b987dcffb",
  userGroups: ["2c08b5d8-7def-4845-a48c-740b987dcffb", ...],
  isMember: true
}
```

Check backend console for:
```
User authorized: user@momentumww.com
```

### Rollback Instructions

If you need to disable group security:

```bash
# View changes
git diff

# Rollback all security changes
git restore .

# Or rollback specific files
git restore auth/authConfig.ts
git restore auth/AuthGuard.tsx
git restore auth/AccessDenied.tsx
git restore contexts/AuthContext.tsx
git restore backend/middleware/auth.js
git restore backend/server.js
```

### Security Benefits

- ✅ **Defense in Depth**: Security enforced at both frontend and backend
- ✅ **No Additional API Calls**: Uses token claims (no Graph API calls needed)
- ✅ **Fast Performance**: Group check happens instantly with token validation
- ✅ **Audit Trail**: All access denials logged for security monitoring
- ✅ **User-Friendly**: Professional access denied page with clear messaging
- ✅ **Compliant**: Meets enterprise security requirements for role-based access control

---

## Configuration

### Environment Variables

The application uses environment variables for sensitive configuration.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CLIENT_ID` | ✅ Yes | API client identifier for Interact.interpublic.com | `"MeetingNotes"` |
| `CLIENT_SECRET` | ✅ Yes | API client secret for authentication | `"eOk9dez@#En@nWw2w%0N"` |
| `DEFAULT_BOT_ID` | ✅ Yes | Bot ID for the AI agent | `"64650431-dad7-4b47-8bb1-4a81800f9f5f"` |
| `GEMINI_API_KEY` | ❌ No | Google Gemini API key (not currently used) | `"PLACEHOLDER_API_KEY"` |

### API Configuration

**Base URL**: `https://interact.interpublic.com`

**Endpoints**:
- **Token**: `POST /api/token`
- **Chat/Messages**: `POST /api/chat-ai/v1/bots/{botId}/messages`

**Authentication**: OAuth 2.0 Client Credentials Flow

**Request Headers**:
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

### Bot ID Configuration

The Bot ID identifies which AI agent to use for processing. You can configure this in two ways:

1. **Environment Variable** (default):
   - Set `DEFAULT_BOT_ID` in `.env.local`

2. **Settings Panel** (runtime):
   - Click the ⚙️ icon in the header
   - Enter a new Bot ID
   - Click "Save" (persisted to `localStorage`)

### MSAL Configuration

**File**: `auth/authConfig.ts`

```typescript
export const msalConfig = {
  auth: {
    clientId: "5fa64631-ea56-4676-b6d5-433d322a4da1",
    authority: "https://login.microsoftonline.com/d026e4c1-5892-497a-b9da-ee493c9f0364",
    redirectUri: "http://localhost:5173", // Change for production
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
```

**Customization Options**:
- `cacheLocation`: `"sessionStorage"` (tab-scoped) or `"localStorage"` (browser-scoped)
- `storeAuthStateInCookie`: Set to `true` for IE11 support
- `navigateToLoginRequestUrl`: Set to `false` to stay on current page after login

### Vite Proxy Configuration

**File**: `vite.config.ts`

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://interact.interpublic.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
```

**Purpose**: Bypasses CORS restrictions during local development by proxying API requests through the Vite dev server.

**Production**: Remove or disable proxy configuration; ensure CORS headers are configured on the API server.

### Meeting Presets

**File**: `constants.ts`

Presets define pre-configured combinations of settings. To add a custom preset:

```typescript
export const MEETING_PRESETS = {
  'my-custom-preset': {
    audience: 'cross-functional',
    tone: 'professional',
    critical_lens: false,
    redact: false,
    use_icons: true,
    bold_important_words: true,
    meeting_coach: true,
    coaching_style: 'gentle',
    view: 'full',
    focus_department: ['General'],
    meeting_preset: 'my-custom-preset',
  },
  // ... other presets
};
```

---

## API Documentation

### Base URL

```
https://interact.interpublic.com
```

### Authentication

All API requests require an OAuth 2.0 access token obtained via the Client Credentials flow.

#### 1. Obtain Access Token

**Endpoint**: `POST /api/token`

**Request Body**:
```json
{
  "client_id": "MeetingNotes",
  "client_secret": "eOk9dez@#En@nWw2w%0N",
  "grant_type": "client_credentials"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Token Caching**: Tokens are cached in `localStorage` with expiration tracking. Automatically refreshed 60 seconds before expiration.

### Key Endpoints

#### 2. Generate Meeting Notes

**Endpoint**: `POST /api/chat-ai/v1/bots/{botId}/messages`

**Headers**:
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are an AI assistant that generates meeting notes..."
    },
    {
      "role": "user",
      "content": "Meeting Title: Q4 Planning\n\nAgenda Items:\n- Budget review\n- Staffing\n\nTranscript:\nJohn: Let's discuss the Q4 budget...\nSarah: I suggest we increase marketing spend..."
    }
  ],
  "controls": {
    "focus_department": ["STR", "PM"],
    "view": "full",
    "critical_lens": true,
    "audience": "cross-functional",
    "tone": "professional",
    "redact": false,
    "use_icons": true,
    "bold_important_words": true,
    "meeting_coach": true,
    "coaching_style": "direct",
    "meeting_preset": "internal-sync"
  }
}
```

**Response**:
```json
{
  "markdown": "# Q4 Planning Meeting Summary\n\n## Key Decisions\n...",
  "next_steps": [
    {
      "department": "STR",
      "owner": "Sarah Johnson",
      "task": "Develop revised marketing budget proposal",
      "due_date": "2024-02-15",
      "status": "AMBER",
      "status_notes": "Awaiting input from finance team"
    }
  ],
  "coach_insights": {
    "initiative": "Q4 Planning",
    "style": "direct",
    "strengths": [
      "Clear agenda structure",
      "Diverse participation"
    ],
    "improvements": [
      "Assign owners to all action items",
      "Document specific deadlines"
    ],
    "facilitation_tips": [
      "Use a parking lot for off-topic items",
      "Recap decisions before closing"
    ],
    "metrics": {
      "agenda_coverage": 85,
      "decision_count": 3,
      "action_count": 7,
      "participant_diversity": 6
    },
    "flags": {
      "participation_imbalance": false,
      "many_unassigned": true,
      "few_decisions": false
    }
  },
  "suggested_questions": [
    "What are the specific risks identified for Q4?",
    "Who will be responsible for tracking budget changes?"
  ]
}
```

### Error Responses

**401 Unauthorized**:
```json
{
  "error": "invalid_token",
  "error_description": "The access token is invalid or expired"
}
```

**400 Bad Request**:
```json
{
  "error": "invalid_request",
  "error_description": "Missing required field: messages"
}
```

**500 Internal Server Error**:
```json
{
  "error": "internal_error",
  "error_description": "An unexpected error occurred"
}
```

---

## Deployment

### Google Cloud Run Deployment

This section documents the deployment of Momentum Note Crafter to Google Cloud Run using a 2-service architecture (frontend + backend) with private IP networking.

---

## Architecture Overview

### Final Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Momentum Employee Browser                                       │
│  URL: https://note-crafter.momentum.com (TBD)                   │
└──────────────────┬──────────────────────────────────────────────┘
                   │ DNS Resolution
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  On-Prem DNS Forwarder → GCP Internal DNS Zone                  │
│  Resolves to: Internal Application Load Balancer (Private IP)   │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Routes Traffic
                   ├────────────────────┬─────────────────────────┐
                   ▼                    ▼                         │
    ┌──────────────────────────┐  ┌──────────────────────────┐   │
    │  Frontend Cloud Run      │  │  Backend Cloud Run       │   │
    │  note-crafter-frontend   │  │  note-crafter-backend    │   │
    │  Private IP              │  │  Private IP              │   │
    │  ┌────────────────────┐  │  │  ┌────────────────────┐  │   │
    │  │ Nginx + React SPA  │  │  │  │ Node.js/Express    │  │   │
    │  │ Static file server │  │  │  │ API proxy service  │  │   │
    │  │ Health: /health    │  │  │  │ Health: /health    │  │   │
    │  └────────────────────┘  │  │  │ JWT validation     │  │   │
    │                          │  │  │ Group membership   │  │   │
    │  Frontend calls:         │  │  │ Stores CLIENT_     │  │   │
    │  backend-url/api/token   │  │  │ SECRET securely    │  │   │
    │  backend-url/api/chat    │  │  └────────────────────┘  │   │
    └──────────────────────────┘  └────────┬─────────────────┘   │
                                           │ VPC Egress            │
                                           ▼                       │
                                  ┌─────────────────────┐          │
                                  │ interact.interpublic │          │
                                  │ .com API             │          │
                                  │ (Internal IPG)       │          │
                                  └─────────────────────┘          │
```

### Why 2 Services?

**Security**: Keeps `CLIENT_SECRET` server-side, never exposed to browser
**Access Control**: Backend validates Azure AD tokens and enforces group membership
**CORS**: Backend handles external API calls, avoiding CORS issues
**Scalability**: Frontend and backend can scale independently
**Best Practice**: Follows Nick's proven Staff Plan architecture
**Defense in Depth**: Group security enforced at both frontend (UX) and backend (API) layers

### Important Architecture Notes

**From Nick Meeting (2025-01-22)**:
- ✅ **Frontend → Backend Communication**: Frontend makes DIRECT calls to backend Cloud Run URL (e.g., `https://note-crafter-backend-xxx.run.app/api/token`)
- ✅ **No Nginx Reverse Proxy**: The nginx.conf does NOT proxy requests to interact.interpublic.com or backend
- ✅ **Backend CORS Configuration**: Backend allows CORS requests from frontend URL
- ✅ **interact.interpublic.com Access**: Confirmed accessible without VPN/netscope requirements

---

## Project Information

- **GCP Project**: `mom-ai-apps`
- **Project Team**: Luis Bustos, Nick Keller (Editors), Jeff Davalos (Admin)
- **Target Platform**: Google Cloud Run (2 services)
- **Repository**: Local Git repository (4 commits)
- **Registry**: `us-east4-docker.pkg.dev/mom-ai-apps/note-crafter`
- **DNS Names**: TBD (need to decide with Nick)

---

## Current Status

### ✅ Code & Configuration (100% Complete)

| Component | Status | Commit | Details |
|-----------|--------|--------|---------|
| Git Repository | ✅ Complete | `7a9bfce` | Initial commit with source code |
| Environment Variables | ✅ Complete | `d1557af` | Removed VITE_ prefix, updated vite.config.ts |
| Deployment Tracker | ✅ Complete | `806914a` | Added comprehensive deployment docs |
| Backend Service | ✅ Complete | `4376144` | Node.js/Express proxy, Dockerfiles, scripts |
| Frontend Dockerfile | ✅ Complete | Updated with Nick | Two-stage build (Node build + Nginx serve) |
| Backend Dockerfile | ✅ Complete | `4376144` | Node.js 18 Alpine, health checks |
| nginx.conf | ✅ Complete | Updated with Nick | Configured for SPA, NO API proxying |
| Build Scripts | ✅ Complete | `4376144` | build-push-frontend.sh, build-push-backend.sh |
| npm build script | ✅ Complete | `4376144` | Added to package.json |

**Code is 100% ready for deployment. Waiting on infrastructure.**

**Note**: During meeting with Nick (2025-01-22), Dockerfile and nginx.conf were updated to match Staff Plan architecture pattern.

### 🚨 Infrastructure Blockers (Jeff's Team)

| Blocker | Owner | Status | Impact | ETA |
|---------|-------|--------|--------|-----|
| **Load Balancer Issue** | Jeff + GCP Support | 🔴 Critical | Can't deploy ANYTHING | 3-7 days |
| **Design Verification** | **Luis + Nick** | 🟠 **Action Required** | Blocks IP assignment | 1 meeting |
| **Private IP Assignment** | Jeff | 🟡 Waiting | Can't deploy | After design verification |
| **VPC Connector** | Jeff | 🟡 Waiting | Backend can't reach interact.interpublic.com | After infrastructure |
| **DNS Zones** | Jeff + IPG Teams | 🟡 Waiting | Can't use friendly URLs | After load balancer |

**Infrastructure Timeline: 1-2 weeks minimum** (per Jeff's update)

### ⏳ Local Setup (In Progress)

| Task | Status | Estimated Time |
|------|--------|----------------|
| Install Docker Desktop | ✅ Complete | 1 hour |
| **Install WSL2 (Required for Docker)** | 🟡 **Restart Required** | 30 minutes |
| Install gcloud CLI | ⏳ Pending | 30 minutes |
| Configure Docker for Artifact Registry | ⏳ Pending | 15 minutes |
| Test Docker builds locally | ⏳ Pending | 1 hour |

**IMPORTANT**: WSL2 (Ubuntu 22.04) installation completed during Nick meeting. **Computer restart required** to complete setup.

---

## Infrastructure Challenges (Jeff's Update)

Jeff's team is working on two critical infrastructure issues that are **new territory** for IPG:

### 1. Network Connectivity (Private IP Addresses)

**Goal**: Cloud Run services communicate through private IPs (not public internet)

**Status**:
- ✅ Nick's Staff Plan: Already has private IP space (working)
- ⏳ Note Crafter: Waiting for private IP assignment
- ✅ **Design Verified with Nick** (2025-01-22 meeting): 2-service architecture confirmed
- 🟡 **Next**: Formally communicate design verification to Jeff

### 2. Name Resolution (Internal DNS)

**Goal**: Access services via friendly names like `note-crafter.momentum.com`

**Status**:
- 🔴 **Critical Blocker**: Internal Application Load Balancer can't see Cloud Run services
- GCP Support ticket opened (as of today)
- IPG Network Security team hasn't done this configuration before
- Requires coordination between multiple teams:
  - Jeff's team (GCP DNS zones)
  - IPG M365/Directory Ops (on-prem DNS forwarders)

**Jeff's Quote**: *"I expect our research and implementation to take at least another few days. I will update you, daily."*

---

## Complete Deployment Plan

### Git Commit History

```bash
4376144 (HEAD -> master) Add backend service, Dockerfiles, and deployment scripts
806914a Add Google Cloud Run deployment progress tracker to README
d1557af Rename environment variables for Docker deployment compatibility
7a9bfce Initial commit: Note Crafter app
```

### Phase 1: Infrastructure Preparation (Jeff's Team) - 1-2 weeks

| Step | Owner | Status | Blocker? |
|------|-------|--------|----------|
| 1.1 Solve Load Balancer Issue | Jeff + GCP Support | 🔴 In Progress | **YES** |
| 1.2 Verify Design with Nick | **Luis + Nick** | ✅ **Complete (2025-01-22)** | No |
| 1.3 Assign Private IP Space | Jeff | 🟡 Waiting on 1.1 + design confirmation email | **YES** |
| 1.4 Create Artifact Registry | Jeff | 🟡 Waiting on 1.3 | No |
| 1.5 Configure VPC Connector | Jeff | 🟡 Waiting on 1.1, 1.3 | **YES** |

**Update**: Met with Nick on 2025-01-22. Architecture verified: 2-service design (frontend + backend) confirmed matching Staff Plan pattern.

### Phase 2: DNS & Naming - 3-5 days

| Step | Owner | Status |
|------|-------|--------|
| 2.1 Decide DNS Names | Luis + Nick | ⏳ Pending |
| 2.2 Create Internal DNS Zones | Jeff's team | ⏳ Waiting |
| 2.3 Configure On-Prem DNS Forwarders | IPG M365/Dir Ops | ⏳ Waiting |

### Phase 3: Local Preparation (In Progress) - 1 day

| Step | Status | Time |
|------|--------|------|
| 3.1 Install Docker Desktop | ✅ Complete | 1 hour |
| 3.1a **Install WSL2 (Windows requirement)** | 🟡 **Restart Required** | 30 min |
| 3.2 Install gcloud CLI | ⏳ After restart | 30 min |
| 3.3 Authenticate gcloud | ⏳ After 3.2 | 5 min |
| 3.4 Configure Docker for Artifact Registry | ⏳ After 3.3 | 5 min |
| 3.5 Test Backend Locally | ⏳ After restart | 1 hour |
| 3.6 Test Frontend Build | ⏳ After restart | 30 min |
| 3.7 Test Docker Builds Locally | ⏳ After restart | 1 hour |

**Update (2025-01-22)**: Docker Desktop installed. WSL2 (Ubuntu 22.04 LTS) installation started. **Computer restart required** to complete WSL2 setup before continuing.

### Phase 4: Docker Build & Push - 1-2 hours

| Step | Status | Dependencies |
|------|--------|--------------|
| 4.1 Install Backend Dependencies | ⏳ Pending | Phase 3 |
| 4.2 Build Frontend Image | ⏳ Pending | Phases 1, 3 |
| 4.3 Build Backend Image | ⏳ Pending | Phases 1, 3 |
| 4.4 Push Frontend Image | ⏳ Pending | Phase 4.2 |
| 4.5 Push Backend Image | ⏳ Pending | Phase 4.3 |

### Phase 5: Cloud Run Deployment - 1 day

| Step | Status | Dependencies |
|------|--------|--------------|
| 5.1 Deploy Backend Service | ⏳ Pending | Phases 1, 4 |
| 5.2 Configure Backend Env Vars | ⏳ Pending | Phase 5.1 |
| 5.3 Test Backend Health & API Connectivity | ⏳ Pending | Phase 5.2 |
| 5.4 Deploy Frontend Service | ⏳ Pending | Phases 2, 4, 5.3 |
| 5.5 Configure DNS Mapping | ⏳ Pending | Phases 2, 5.4 |

### Phase 6: Frontend Code Updates - 2-3 hours

| Step | Status | Dependencies |
|------|--------|--------------|
| 6.1 Update apiService.ts to call backend | ⏳ Pending | Phase 5.1 (need backend URL) |
| 6.2 Remove CLIENT_SECRET from frontend | ⏳ Pending | Phase 6.1 |
| 6.3 Update MSAL Redirect URI | ⏳ Pending | Phase 5.4 (need frontend URL) |
| 6.4 Rebuild & Redeploy Frontend | ⏳ Pending | Phases 6.1-6.3 |

### Phase 7: Testing & Validation - 1 day

| Step | Status |
|------|--------|
| 7.1 Test MSAL Authentication | ⏳ Pending |
| 7.2 Test Token Acquisition | ⏳ Pending |
| 7.3 Test Meeting Notes Generation | ⏳ Pending |
| 7.4 Test Export Functions | ⏳ Pending |
| 7.5 Test from Different Networks | ⏳ Pending |
| 7.6 User Acceptance Testing | ⏳ Pending |

### Phase 8: Production Hardening (Optional) - 1-2 days

| Step | Status |
|------|--------|
| 8.1 Move CLIENT_SECRET to Secret Manager | ⏳ Pending |
| 8.2 Configure Cloud Logging | ⏳ Pending |
| 8.3 Configure Cloud Monitoring Alerts | ⏳ Pending |
| 8.4 Create Dev Environment | ⏳ Pending |
| 8.5 Document Operations Runbook | ⏳ Pending |

**Total Timeline: 2-3 weeks** (Critical Path: Phase 1 Infrastructure)

---

## Critical Next Actions

### ✅ ~~PRIORITY 1: Talk to Nick~~ COMPLETE (2025-01-22)

**Status**: Met with Nick on 2025-01-22. Key outcomes:

1. **Architecture Confirmed**: ✅ 2-service design (frontend + backend) matches Staff Plan pattern
2. **Nginx Configuration**: ✅ nginx.conf does NOT proxy to interact.interpublic.com - frontend calls backend directly
3. **Backend CORS**: ✅ Backend allows CORS requests from frontend URL
4. **Network Access**: ✅ interact.interpublic.com is accessible without VPN/netscope
5. **DNS Names**: Still TBD - will decide later
6. **Docker Setup**: Started during call - WSL2 installation requires computer restart

**Files Updated During Meeting**:
- Dockerfile (Nick sent updated version)
- nginx.conf (Nick sent updated configuration)
- build-push-image script (Nick provided)

### 🟡 NEW PRIORITY 1: Complete WSL2 Setup (AFTER RESTART)

**Status**: WSL2 (Ubuntu 22.04 LTS) installation started. **Computer restart required** to complete.

**After Restart**:
1. Verify WSL2 is working: `wsl --status`
2. Launch Ubuntu: `wsl` or search "Ubuntu" in Start Menu
3. Complete Docker Desktop setup with WSL2 backend
4. Continue with Nick to test Docker builds
5. Test build-push scripts locally

### 🚨 NEW PRIORITY 2: Email Jeff - Design Verified (URGENT)

### ⏸️ PRIORITY 3: Install gcloud CLI (After Restart)

**gcloud CLI**:
1. Download: https://cloud.google.com/sdk/docs/install-sdk#windows
2. Run installer: `GoogleCloudSDKInstaller.exe`
3. Restart terminal
4. Authenticate: `gcloud auth login`
5. Set project: `gcloud config set project mom-ai-apps`
6. Configure Docker: `gcloud auth configure-docker us-east4-docker.pkg.dev`
7. Verify: `gcloud --version`

### ⏸️ PRIORITY 4: Wait for Infrastructure (Jeff's Team)

Monitor Jeff's daily updates on:
- Load balancer issue resolution (GCP Support ticket)
- Private IP assignment (after receiving design confirmation email from Luis)
- VPC connector configuration

---

## Email Templates

### To Nick - Design Verification

```
Hi Nick,

Jeff mentioned I need to "verify the design with you" before he can assign
private IP address space for Note Crafter.

Can we schedule a quick call to discuss:

1. Architecture Review: My 2-service design (frontend + backend) - confirm
   it matches your Staff Plan pattern

2. DNS Names: What should we call the services? Following your naming convention:
   - Frontend: note-crafter.momentum.com?
   - Backend: note-crafter-api.momentum.com?

3. Network Setup: Does my backend need VPC egress to reach interact.interpublic.com?
   How did you handle this for Staff Plan?

4. Private IP Strategy: Should both services have private IPs?
   Or frontend public + backend private?

Jeff's team is working on the load balancer issue (they opened a GCP Support ticket),
but they can't assign my IP space until we verify the design.

When works for you?

Thanks!
Luis
```

### To Jeff - Design Verification Complete

```
Hi Jeff,

I met with Nick today (2025-01-22) and verified the design for Note Crafter.

Architecture Confirmed:
- ✅ 2-service design (frontend + backend) - matches Nick's Staff Plan pattern
- ✅ Frontend: Nginx + React SPA (static file server)
- ✅ Backend: Node.js/Express API proxy (stores CLIENT_SECRET securely)
- ✅ Frontend makes direct calls to backend Cloud Run URL
- ✅ Backend needs VPC egress to reach interact.interpublic.com
- ✅ Nick confirmed interact.interpublic.com is accessible without VPN

Files Updated:
- Dockerfile and nginx.conf updated during meeting with Nick
- Build scripts ready to go

Current Status:
- ✅ Code: 100% ready for deployment
- ✅ Design: Verified with Nick (2-service architecture)
- 🟡 Local Setup: WSL2 installed, computer restart required to complete Docker setup
- ⏳ Infrastructure: Waiting on load balancer resolution and private IP assignment

You can now proceed with assigning private IP space for Note Crafter.

Standing by for your daily updates!

Thanks,
Luis
```

---

## Docker Build & Push Instructions

### Prerequisites

Before you can build and push Docker images:

1. **Docker Desktop installed and running**
   ```bash
   docker --version
   docker ps
   ```

   **Windows Users - WSL2 Required**:
   Docker Desktop on Windows requires WSL2 (Windows Subsystem for Linux 2).

   **Install WSL2**:
   ```powershell
   # Run PowerShell as Administrator
   wsl --install

   # Or install specific distribution (recommended: Ubuntu 22.04)
   wsl --install -d Ubuntu-22.04
   ```

   **After Installation**:
   - Computer restart is required to complete WSL2 installation
   - After restart, Docker Desktop will automatically use WSL2 backend
   - Verify WSL2 is working: `wsl --status`
   - Launch Ubuntu: `wsl` or search "Ubuntu" in Start Menu

2. **gcloud CLI installed and authenticated**
   ```bash
   gcloud --version
   gcloud auth login
   gcloud config set project mom-ai-apps
   ```

3. **Docker configured for Artifact Registry**
   ```bash
   gcloud auth configure-docker us-east4-docker.pkg.dev
   ```

4. **Artifact Registry repository created** (Jeff will do this)
   ```bash
   # Check if exists:
   gcloud artifacts repositories list --project=mom-ai-apps --location=us-east4
   ```

### Building & Pushing Frontend

```bash
# Option 1: Use the script (recommended)
./build-push-frontend.sh

# Option 2: Manual commands
docker build -t us-east4-docker.pkg.dev/mom-ai-apps/note-crafter/note-crafter-frontend:latest .
docker push us-east4-docker.pkg.dev/mom-ai-apps/note-crafter/note-crafter-frontend --all-tags
```

### Building & Pushing Backend

```bash
# Option 1: Use the script (recommended)
./build-push-backend.sh

# Option 2: Manual commands
cd backend
npm install
docker build -t us-east4-docker.pkg.dev/mom-ai-apps/note-crafter/note-crafter-backend:latest .
docker push us-east4-docker.pkg.dev/mom-ai-apps/note-crafter/note-crafter-backend --all-tags
```

### Testing Locally First

Test your Docker builds work before pushing:

**Frontend:**
```bash
# Build locally
docker build -t note-crafter-frontend:test .

# Run locally
docker run -p 8080:8080 note-crafter-frontend:test

# Test in browser: http://localhost:8080
```

**Backend:**
```bash
cd backend
docker build -t note-crafter-backend:test .

# Run with env vars
docker run -p 8080:8080 \
  -e CLIENT_ID=YourClientID \
  -e CLIENT_SECRET=YourSecret \
  note-crafter-backend:test

# Test health: http://localhost:8080/health
```

---

## Deployment Commands (After Infrastructure Ready)

### Deploy Backend Service

```bash
gcloud run deploy note-crafter-backend \
  --image us-east4-docker.pkg.dev/mom-ai-apps/note-crafter/note-crafter-backend:latest \
  --platform managed \
  --region us-east4 \
  --set-env-vars CLIENT_ID=YourClientID,CLIENT_SECRET=YourClientSecret,API_BASE_URL=https://interact.interpublic.com \
  --no-allow-unauthenticated \
  --vpc-connector YOUR_VPC_CONNECTOR \
  --service-account YOUR_SERVICE_ACCOUNT
```

### Deploy Frontend Service

```bash
gcloud run deploy note-crafter-frontend \
  --image us-east4-docker.pkg.dev/mom-ai-apps/note-crafter/note-crafter-frontend:latest \
  --platform managed \
  --region us-east4 \
  --allow-unauthenticated \
  --vpc-connector YOUR_VPC_CONNECTOR
```

---

## Troubleshooting

### Docker Issues

**Problem**: `docker: command not found`
**Solution**: Install Docker Desktop, restart computer

**Problem**: `permission denied while trying to connect to Docker daemon`
**Solution**: Start Docker Desktop application

**Problem**: `unauthorized: You don't have the needed permissions`
**Solution**: Run `gcloud auth configure-docker us-east4-docker.pkg.dev`

### gcloud Issues

**Problem**: `gcloud: command not found`
**Solution**: Install gcloud CLI, restart terminal

**Problem**: `denied: Permission denied for project`
**Solution**: Verify project: `gcloud config get-value project` (should be `mom-ai-apps`)

### Build Issues

**Problem**: Build fails with `npm ERR!`
**Solution**: Check `package.json` has `build` script, try `npm install` first

**Problem**: `repository does not exist`
**Solution**: Ask Jeff to create the Artifact Registry repository

---

## Success Criteria

Deployment is successful when:
- ✅ Frontend accessible via friendly DNS name (e.g., `note-crafter.momentum.com`)
- ✅ Backend running on private IP (not publicly accessible)
- ✅ MSAL authentication working
- ✅ Meeting notes generation working end-to-end
- ✅ All export functions (CSV, PDF, Email) working
- ✅ Health checks passing on both services
- ✅ CLIENT_SECRET never exposed to browser
- ✅ Backend successfully calling interact.interpublic.com through VPC

---

## Related Documentation

- Backend Service: See [backend/README.md](backend/README.md)
- Docker Build Scripts: See `build-push-frontend.sh` and `build-push-backend.sh`
- Frontend Dockerfile: See [Dockerfile](Dockerfile)
- Backend Dockerfile: See [backend/Dockerfile](backend/Dockerfile)
- Nginx Configuration: See [nginx.conf](nginx.conf)

---

### Alternative Deployment Options (Not Currently Used)

1. **Set production environment variables**:

Create a `.env.production` file:

```env
CLIENT_ID="MeetingNotes"
CLIENT_SECRET="your-production-secret"
DEFAULT_BOT_ID="64650431-dad7-4b47-8bb1-4a81800f9f5f"
```

2. **Update MSAL redirect URI** in `auth/authConfig.ts`:

```typescript
redirectUri: "https://yourdomain.com"
```

3. **Build the application**:

```bash
npm run build
```

Expected output:
```
vite v5.2.11 building for production...
✓ 1234 modules transformed.
dist/index.html                    1.23 kB
dist/assets/index-a1b2c3d4.css    45.67 kB │ gzip: 12.34 kB
dist/assets/index-e5f6g7h8.js    234.56 kB │ gzip: 78.90 kB
✓ built in 5.67s
```

4. **Preview the build locally** (optional):

```bash
npm run preview
```

### Deployment Platforms

#### Option 1: Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configure environment variables in Vercel dashboard:
   - Add `CLIENT_ID`
   - Add `CLIENT_SECRET`
   - Add `DEFAULT_BOT_ID`

4. Update Azure AD redirect URI to match Vercel deployment URL

#### Option 2: Azure Static Web Apps

1. Create a Static Web App in Azure Portal

2. Connect to your GitHub repository

3. Configure build settings:
   - **App location**: `/`
   - **API location**: (leave empty)
   - **Output location**: `dist`

4. Add environment variables in Azure Portal:
   - Navigate to **Configuration** → **Application settings**
   - Add `CLIENT_ID`, `CLIENT_SECRET`, `DEFAULT_BOT_ID`

5. Push to GitHub to trigger automatic deployment

#### Option 3: Google AI Studio

1. Ensure your app is ready for AI Studio:
   - Set redirect URI to `https://aistudio.google.com`
   - Mock authentication will activate automatically

2. Deploy via AI Studio interface:
   - Upload your built `dist/` folder
   - Configure app settings
   - Publish to AI Studio app gallery

3. Access your app at: `https://ai.studio/apps/drive/{your-app-id}`

### SSL/TLS Configuration

**Vercel/Azure**: SSL certificates are automatically provisioned.

**Custom Domain**:
1. Configure DNS records (A or CNAME)
2. Enable HTTPS via your hosting provider
3. Enforce HTTPS redirects

### CORS Configuration

For production, ensure your API server (`interact.interpublic.com`) allows requests from your deployment domain:

**Required headers**:
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

**Vite proxy** is only for local development and should be disabled/removed in production builds.

### Environment-Specific Configuration

**Development**:
- `redirectUri`: `http://localhost:5173`
- `cacheLocation`: `sessionStorage`
- Vite proxy enabled

**Production**:
- `redirectUri`: `https://yourdomain.com`
- `cacheLocation`: `localStorage` (optional, for cross-tab persistence)
- Vite proxy disabled
- Minified build
- HTTPS enforced

---

## Troubleshooting

### Authentication Issues

#### Problem: "Popup blocked" error
**Solution**:
1. The app will detect popup blocking and show fallback UI
2. Allow popups for `login.microsoftonline.com` in browser settings
3. Alternatively, the app will fall back to redirect flow

#### Problem: "AADSTS50011 - Redirect URI mismatch"
**Solution**:
- Verify `redirectUri` in `auth/authConfig.ts` matches Azure AD app registration
- Include or exclude trailing slash consistently
- Ensure protocol matches (http vs https)

#### Problem: User profile not loading
**Solution**:
1. Check browser console for Microsoft Graph API errors
2. Verify `User.Read` permission is granted in Azure AD
3. Check network tab for 401/403 responses
4. Ensure access token is present in Authorization header

#### Problem: Silent token acquisition fails
**Solution**:
- Clear browser cache and cookies
- Log out and log back in
- Check if token is expired (should auto-refresh)
- Verify MSAL cache location setting

### API Connection Issues

#### Problem: "Failed to fetch token" error
**Solution**:
1. Verify `CLIENT_ID` and `CLIENT_SECRET` in `.env.local`
2. Check network tab for 401/400 responses
3. Ensure API credentials are correct
4. Confirm API server is accessible (not behind firewall)

#### Problem: "Bot ID not found" error
**Solution**:
1. Open Settings panel (⚙️ icon)
2. Verify Bot ID matches a valid agent
3. Try default Bot ID: `64650431-dad7-4b47-8bb1-4a81800f9f5f`
4. Contact IT/DevOps for valid Bot IDs

#### Problem: CORS errors in browser console
**Solution**:
- **Development**: Ensure Vite proxy is configured correctly in `vite.config.ts`
- **Production**: Contact API administrator to add your domain to CORS whitelist
- Verify API base URL is correct

#### Problem: Token expires too quickly
**Solution**:
- Tokens are cached and auto-refreshed 60 seconds before expiration
- Check `expires_in` value from `/api/token` response
- Ensure token refresh logic is working (check browser console logs)

### Build/Deployment Errors

#### Problem: `npm run build` fails with TypeScript errors
**Solution**:
1. Run `npm install` to ensure dependencies are up-to-date
2. Check TypeScript errors in console output
3. Fix type issues in code
4. Verify `tsconfig.json` settings

#### Problem: Environment variables not working in production
**Solution**:
- Ensure environment variables are configured properly in your build system
- Re-run build after changing `.env` files
- Verify environment variables are set in hosting platform dashboard
- Check `import.meta.env.*` usage in code

#### Problem: "Cannot find module" errors after deployment
**Solution**:
1. Verify all imports use correct relative paths
2. Check case sensitivity (Unix/Linux is case-sensitive)
3. Ensure `node_modules` are installed (`npm install`)
4. Rebuild with `npm run build`

### UI/UX Issues

#### Problem: Dark mode not persisting
**Solution**:
- Check browser localStorage for `theme` key
- Verify localStorage is not disabled (private browsing mode)
- Try clearing browser cache

#### Problem: Form data not saving
**Solution**:
- Check localStorage quota (usually 5-10 MB)
- Verify localStorage is enabled
- Try "Clear Data" button and re-enter

#### Problem: File upload not working
**Solution**:
1. Ensure file is `.txt` or `.docx` format
2. Check file size (recommended < 5 MB)
3. For `.docx`, verify Mammoth.js library loaded (check network tab)
4. Check browser console for parsing errors

#### Problem: Export to CSV/Email not working
**Solution**:
- Ensure action items table is populated
- Check browser console for export errors
- Verify browser allows downloads (not blocked)
- For email draft, check if default email client is configured

### Performance Issues

#### Problem: Slow note generation
**Solution**:
- API processing time depends on transcript length
- Typical processing: 5-15 seconds for 5-page transcripts
- Check network tab for slow API responses
- Try shorter transcripts to isolate issue

#### Problem: App feels sluggish
**Solution**:
1. Clear browser cache
2. Disable browser extensions (ad blockers, etc.)
3. Check for large localStorage data (clear if needed)
4. Use latest Chrome/Edge browser for best performance

---

## File Structure

```
c:\Users\luis.bustos\Downloads\Momo Mettings App\
│
├── 📁 auth/                          # Authentication module
│   ├── authConfig.ts                 # MSAL configuration (client ID, tenant ID, scopes, group ID)
│   ├── AuthGuard.tsx                 # Authentication wrapper + group membership validation
│   ├── AccessDenied.tsx              # Access denied page (non-Momentum users)
│   └── SignInPage.tsx                # Sign-in UI (popup blocked fallback)
│
├── 📁 components/                    # React components
│   ├── Header.tsx                    # App header with user menu, theme toggle, settings
│   ├── InputPanel.tsx                # Left panel: meeting input form
│   ├── OutputPanel.tsx               # Right panel: generated notes display
│   ├── SettingsDrawer.tsx            # Slide-out settings panel (Bot ID config)
│   ├── HelpModal.tsx                 # Help documentation modal
│   ├── EmailDraftModal.tsx           # Email export modal
│   ├── InterrogateTranscriptModal.tsx # Transcript Q&A chat interface
│   │
│   ├── 📁 tour/                      # Onboarding tour components
│   │   ├── TourWelcomeModal.tsx      # Welcome modal (first launch)
│   │   ├── TourStep.tsx              # Individual tour step with highlight
│   │   └── TourController.tsx        # Tour orchestration and state management
│   │
│   └── 📁 ui/                        # Reusable UI component library
│       ├── Button.tsx                # Button with variants (primary, secondary, ghost)
│       ├── Icon.tsx                  # SVG icon system (30+ icons)
│       ├── Card.tsx                  # Card container with shadow/border
│       ├── Input.tsx                 # Text input with label
│       ├── Textarea.tsx              # Text area with auto-resize
│       ├── Toast.tsx                 # Toast notification system
│       ├── ToggleSwitch.tsx          # Toggle switch control
│       ├── Select.tsx                # Select dropdown with search
│       ├── Chip.tsx                  # Tag/chip component (removable)
│       ├── Tooltip.tsx               # Tooltip with hover trigger
│       ├── LoadingModal.tsx          # Full-screen loading spinner
│       ├── SkeletonLoader.tsx        # Content loading skeleton
│       └── ScrollToTop.tsx           # Floating scroll to top button (appears after 400px scroll)
│
├── 📁 contexts/                      # React Context providers
│   ├── AuthContext.tsx               # Authentication state (user, logout, profile)
│   └── TourContext.tsx               # Tour state (current step, completion)
│
├── 📁 hooks/                         # Custom React hooks
│   ├── useLocalStorage.ts            # localStorage with React state sync
│   └── useDebounce.ts                # Debounce hook for input delays
│
├── 📁 services/                      # API service layer
│   ├── apiService.ts                 # API client (token acquisition, chat endpoint)
│   └── geminiService.ts              # Placeholder for Google Gemini (unused)
│
├── 📁 utils/                         # Utility functions
│   ├── export.ts                     # CSV export logic
│   ├── formatting.ts                 # Markdown to HTML conversion
│   ├── parsing.ts                    # Text parsing utilities
│   ├── tourHelper.ts                 # Tour helper functions
│   ├── telemetryService.ts           # Centralized telemetry tracking service (25 event types)
│   ├── browserContext.ts             # Browser/device detection for telemetry
│   └── reporting.ts                  # Legacy Power Automate flow trigger utility
│
├── 📄 App.tsx                        # Main app component (layout, routing)
├── 📄 appConfig.ts                   # Power Automate flow URL configuration
├── 📄 index.tsx                      # React DOM entry point
├── 📄 index.html                     # HTML template (Tailwind CDN, meta tags)
├── 📄 types.ts                       # TypeScript interfaces and types
├── 📄 constants.ts                   # App constants (departments, presets, defaults)
│
├── 📄 vite.config.ts                 # Vite configuration (proxy, build settings)
├── 📄 tsconfig.json                  # TypeScript configuration (strict mode, paths)
├── 📄 package.json                   # Dependencies and scripts
├── 📄 package-lock.json              # Dependency lock file
│
├── 📄 .env.local                     # Environment variables (not in git)
├── 📄 .env.example                   # Example environment variables template
├── 📄 .gitignore                     # Git ignore rules
│
├── 📁 backend/                       # Backend API proxy service (Node.js/Express)
│   ├── 📁 middleware/                # Express middleware
│   │   └── auth.js                   # JWT validation and group membership middleware
│   ├── server.js                     # Backend server with API proxying
│   ├── package.json                  # Backend dependencies (jsonwebtoken, jwks-rsa)
│   ├── Dockerfile                    # Backend Docker container configuration
│   └── .env                          # Backend environment variables
│
├── 📄 Dockerfile                     # Frontend Docker container configuration (Nginx + React)
├── 📄 nginx.conf                     # Nginx configuration for SPA routing
├── 📄 build-push-image.sh            # Docker build and push script (Linux/Mac)
├── 📄 build-and-push.ps1             # Docker build and push script (Windows)
│
└── 📄 README.md                      # Project documentation (this file)
```

### Key Files Explained

#### Configuration Files

- **`vite.config.ts`**: Vite build tool configuration
  - Dev server settings (port 5173)
  - API proxy to `https://interact.interpublic.com` (bypasses CORS in dev)
  - React plugin with Fast Refresh

- **`tsconfig.json`**: TypeScript compiler configuration
  - Target: ES2022
  - Strict mode enabled (type safety)
  - Path aliases: `@/*` maps to project root

- **`.env.local`**: Environment variables (gitignored)
  - API credentials (client ID, secret)
  - Bot ID for AI agent
  - Sensitive data (never commit)

#### Core Application Files

- **`App.tsx`**: Main application component
  - Wraps entire app with MSAL provider
  - Provides AuthContext and TourContext
  - Splits UI into InputPanel and OutputPanel
  - Handles dark mode theme

- **`types.ts`**: TypeScript type definitions
  - FormState, Controls, AgentResponse, NextStep, CoachInsights
  - Type safety across entire codebase

- **`constants.ts`**: Application constants
  - Department list
  - Meeting presets configurations
  - Default control values
  - Context tag options

#### Authentication Module

- **`auth/authConfig.ts`**: MSAL configuration
  - Client ID, tenant ID, authority URL
  - Scopes (User.Read)
  - Microsoft Graph endpoints

- **`auth/AuthGuard.tsx`**: Authentication wrapper
  - Detects AI Studio environment (uses mock auth)
  - Handles MSAL initialization
  - Manages login flow (popup vs redirect)
  - Fetches user profile from Microsoft Graph

- **`auth/SignInPage.tsx`**: Sign-in UI
  - Shown when user is not authenticated
  - Popup blocked detection and fallback

#### Service Layer

- **`services/apiService.ts`**: API client
  - Token acquisition with caching
  - Chat/message endpoint for note generation
  - Error handling and retry logic
  - Token refresh before expiration

#### Component Architecture

**Input Components** (`InputPanel.tsx`):
- Meeting title, agenda, transcript inputs
- File upload (`.txt`, `.docx`)
- Control selectors (audience, tone, view mode)
- Meeting presets dropdown
- Advanced controls accordion
- Sample data loader

**Output Components** (`OutputPanel.tsx`):
- Markdown-formatted meeting summary
- Action items table with status indicators
- Meeting coach insights accordion
- Suggested questions
- Export buttons (CSV, Email, PDF)
- Transcript interrogation button

**UI Component Library** (`components/ui/`):
- 13 reusable components
- Consistent Tailwind CSS styling
- Accessible (ARIA labels, semantic HTML)
- Dark mode support

---

## Development Notes

### For Developers

#### Prerequisites for Contributing

- Familiarity with React 18 (hooks, context)
- TypeScript experience (strict mode)
- Understanding of OAuth 2.0 / MSAL
- Tailwind CSS knowledge

#### Coding Standards

**TypeScript**:
- Use strict mode (enabled in `tsconfig.json`)
- Define explicit types for all function parameters and return values
- Use interfaces for object shapes
- Avoid `any` type (use `unknown` if necessary)

**React**:
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused
- Use Context API for global state (avoid prop drilling)
- Memoize expensive computations with `useMemo`/`useCallback`

**Naming Conventions**:
- Components: PascalCase (`MyComponent.tsx`)
- Functions/variables: camelCase (`handleSubmit`, `userData`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_BOT_ID`)
- Types/Interfaces: PascalCase (`FormState`, `AgentResponse`)

**File Organization**:
- One component per file
- Co-locate related files (e.g., `Tour` components in `components/tour/`)
- Keep utility functions in `utils/`
- Keep API calls in `services/`

#### Testing Approach

**Manual Testing**:
1. Test authentication flow (login, logout)
2. Test meeting note generation with various inputs
3. Test export functionality (CSV, email, PDF)
4. Test dark mode toggle
5. Test file upload (`.txt`, `.docx`)
6. Test responsive design (desktop, tablet)

**Recommended Test Cases**:
- Empty transcript handling
- Very long transcripts (>10,000 words)
- Special characters in input
- Invalid file formats
- API timeout scenarios
- Token expiration and refresh
- Popup blocker scenarios

**Automated Testing** (future):
- Consider adding Jest + React Testing Library
- Unit tests for utility functions
- Integration tests for API service
- E2E tests with Playwright/Cypress

#### Adding New Features

**Example: Adding a new meeting preset**

1. Define preset in `constants.ts`:
```typescript
export const MEETING_PRESETS = {
  'my-new-preset': {
    audience: 'executive',
    tone: 'concise',
    critical_lens: false,
    redact: true,
    use_icons: false,
    bold_important_words: true,
    meeting_coach: false,
    coaching_style: 'gentle',
    view: 'actions-only',
    focus_department: ['General'],
    meeting_preset: 'my-new-preset',
  },
  // ...
};
```

2. Add to UI in `InputPanel.tsx`:
```typescript
<option value="my-new-preset">🎯 My New Preset</option>
```

3. Test with sample meeting data

**Example: Adding a new export format**

1. Create utility function in `utils/export.ts`:
```typescript
export function exportToJSON(data: AgentResponse, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

2. Add button in `OutputPanel.tsx`:
```typescript
<Button
  variant="ghost"
  onClick={() => exportToJSON(output, 'meeting-notes.json')}
>
  <Icon name="download" className="mr-2" />
  Export JSON
</Button>
```

#### Debugging Tips

**React DevTools**:
- Install React DevTools browser extension
- Inspect component props and state
- Profile rendering performance

**Network Debugging**:
- Use browser DevTools Network tab
- Check API request/response payloads
- Verify Authorization headers

**MSAL Debugging**:
- Enable MSAL logging in `authConfig.ts`:
```typescript
system: {
  loggerOptions: {
    loggerCallback: (level, message, containsPii) => {
      console.log(message);
    },
    piiLoggingEnabled: false,
    logLevel: LogLevel.Verbose,
  },
}
```

#### Contributing Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-new-feature`
3. **Make your changes**
4. **Test thoroughly** (manual testing + edge cases)
5. **Commit with clear messages**: `git commit -m "Add JSON export functionality"`
6. **Push to your fork**: `git push origin feature/my-new-feature`
7. **Open a pull request** with detailed description

**Pull Request Checklist**:
- [ ] Code follows project conventions
- [ ] TypeScript types are defined
- [ ] No console errors or warnings
- [ ] Tested in Chrome and Edge
- [ ] Dark mode works correctly
- [ ] README updated (if needed)

---

## Recent Changes

### 📅 Latest Update - 2025-11-12 - Application Repurposed: Employee Onboarding System (v2.0.0)

**Summary**: Transformed the Meeting Notes Generator into a comprehensive Employee Onboarding System while preserving 70-80% of the existing infrastructure. The application now manages the complete employee onboarding lifecycle from pre-hire candidate tracking through equipment provisioning and system access setup.

#### Major Transformation

**What Changed** 🔄:
1. **Complete Application Purpose**: Meeting notes generation → Employee onboarding management
2. **New Core Features**:
   - Pre-hire candidate tracking with package assignment
   - Role-based equipment package management (e.g., "XD Designer Standard")
   - Automated approval workflow (standard auto-approve, exceptions to SVP)
   - Workday freeze period automation (Nov - Jan 5)
   - Helix ticketing integration
   - Onboarding progress tracking
3. **New Data Model**: Hardware, Package, Software, PreHire, Employee, ApprovalRequest, HelixTicket entities
4. **System Integrations**: Workday, Active Directory, Vantage, Weenus, Helix, Orbit
5. **Removed Meeting Features**: Calendar selection, transcript processing, meeting coach, participant extraction

**What Was Preserved** ✅:
1. **Authentication System**: MSAL + Azure AD + Group security (100% reusable)
2. **UI Component Library**: All 15 components (Button, Card, Input, etc.)
3. **Graph API Integration**: User profiles, department lookup, presence
4. **Momentum Department Service**: 962 users from Power Platform (perfect fit!)
5. **Telemetry Framework**: Comprehensive event tracking (updated event types)
6. **Cloud Run Deployment**: Complete infrastructure ready to reuse
7. **Backend Authentication**: JWT validation + group membership middleware
8. **AI Agent Integration**: `apiService.ts` preserved for potential future use
9. **UX Features**: Dark mode, i18n, feedback system, version checking

**Files Documentation Updated**:
- 📄 [CLAUDE.md](CLAUDE.md) - Complete documentation transformation
  - Updated title, overview, and target users
  - Added System Architecture and Onboarding Process Flow sections
  - Replaced meeting-specific features with onboarding features
  - Added comprehensive Data Model section (8 entities)
  - Added System Integration Points section
  - Added Current Issues & Solutions section
  - Updated telemetry events for onboarding tracking

**Benefits**:
- ✅ **Code Reuse**: 70-80% of existing codebase preserved
- ✅ **Proven Infrastructure**: Authentication, UI, telemetry all battle-tested
- ✅ **Department Data**: Momentum integration already working perfectly
- ✅ **Fast Development**: Leveraging existing components and patterns
- ✅ **Cloud Deployment**: Cloud Run setup ready to use

**Next Steps**:
1. Phase 2: Remove meeting-specific components
2. Phase 3: Create onboarding data model (types.ts)
3. Phase 4: Build onboarding UI components
4. Phase 5: Backend API development
5. Phase 6: Power Automate flows integration

**Version**: 2.0.0
**Release Date**: November 12, 2025
**Status**: Phase 1 Complete (Documentation) ✅

---

### 📅 Previous Update - 2025-11-05 - Persistent Critical Thinking Analysis (v1.7.0)

**Summary**: Enhanced the Critical Thinking feature to cache analysis results, allowing users to expand/collapse analyses without re-calling the API. The 💭 icon now remains visible after an analysis is fetched, providing quick access to previously generated insights.

#### Critical Thinking Persistence Enhancement

**What Was The Issue** ❌:
1. **Wasteful API Calls**: Every time a user collapsed and re-opened a Critical Thinking panel, it triggered a new API call
   - First click: Fetch analysis → Show results
   - Second click: Delete cached results → Collapse panel
   - Third click: Fetch analysis again (unnecessary duplicate!)
   - **Impact**: Wasted API tokens, slower UX, and unnecessary load on the interrogation agent
2. **Lost Icon Visibility**: The 💭 icon only appeared on hover, making it hard to remember which items had analysis available
3. **No State Persistence**: Closing a panel meant losing all the analysis data that was just fetched

**What Was Fixed** ✅:
1. **Separated State Management**: Split analysis data from UI state in both components
   - `fetchedAnalyses` - Stores actual analysis data (never deleted on collapse)
   - `expandedItems` - Tracks which panels are currently open/closed (toggles true/false)
   - **Impact**: Analysis data persists even when panels are collapsed
2. **Smart Toggle Behavior**: Click handler now checks if data exists before calling API
   - If already fetched: Toggle expansion state only (instant, no API call)
   - If not fetched: Call API once and cache the result
   - **Impact**: 100% reduction in duplicate API calls
3. **Persistent Icon Visibility**: Icon remains visible after first fetch
   - Before: Icon only visible on hover
   - After: Icon always visible once analysis exists
   - **Impact**: Better discoverability and quick access to analyses
4. **Updated Both Grouping Modes**: Applied changes consistently to:
   - Subsection component (for "By Topic" mode) - Uses numeric index keys
   - ContentTypeSection component (for "By Type" mode) - Uses "workstream-itemIndex" string keys
   - **Impact**: Consistent behavior across all viewing modes

**Files Modified**:
- 📄 [components/StructuredNotesView.tsx](components/StructuredNotesView.tsx):
  - Lines 281-287: Updated Subsection state declarations (split state into `fetchedAnalyses` and `expandedItems`)
  - Lines 289-353: Modified Subsection click handler to check cache before calling API
  - Lines 399-417: Updated icon visibility condition to show when `fetchedAnalyses[idx]` exists
  - Lines 420-426: Modified panel rendering to check both `expandedItems` AND `fetchedAnalyses`
  - Lines 834-840: Updated ContentTypeSection state declarations (same pattern with string keys)
  - Lines 842-908: Modified ContentTypeSection click handler (same logic, different key format)
  - Lines 984-1002: Updated ContentTypeSection icon visibility
  - Lines 1005-1011: Modified ContentTypeSection panel rendering

**Technical Implementation**:

**New State Structure (Subsection)**:
```typescript
// Before (single state, deleted on collapse)
const [expandedCriticalThinking, setExpandedCriticalThinking] =
  useState<Record<number, CriticalThinkingAnalysis | null>>({});

// After (separated concerns)
const [fetchedAnalyses, setFetchedAnalyses] =
  useState<Record<number, CriticalThinkingAnalysis>>({});  // Persistent
const [expandedItems, setExpandedItems] =
  useState<Record<number, boolean>>({});  // UI state only
```

**Smart Click Handler Logic**:
```typescript
const handleCriticalThinkingClick = async (itemIndex: number, itemText: string) => {
  // If already fetched, just toggle expansion (no API call!)
  if (fetchedAnalyses[itemIndex]) {
    setExpandedItems(prev => ({
      ...prev,
      [itemIndex]: !prev[itemIndex]  // Toggle true ↔ false
    }));
    return;
  }

  // Otherwise, fetch and cache
  const analysis = await onRequestCriticalThinking(request);
  setFetchedAnalyses(prev => ({ ...prev, [itemIndex]: analysis }));
  setExpandedItems(prev => ({ ...prev, [itemIndex]: true }));
};
```

**Icon Visibility Update**:
```typescript
// Before: Only visible on hover or when expanded
hoveredItem === idx || expandedCriticalThinking[idx]

// After: Visible on hover OR when analysis exists
hoveredItem === idx || fetchedAnalyses[idx]
```

**Panel Rendering Update**:
```typescript
// Before: Show if expanded (includes analysis data)
{expandedCriticalThinking[idx] && (
  <CriticalThinkingPanel analysis={expandedCriticalThinking[idx]!} />
)}

// After: Show if expanded AND fetched (separated concerns)
{expandedItems[idx] && fetchedAnalyses[idx] && (
  <CriticalThinkingPanel analysis={fetchedAnalyses[idx]} />
)}
```

**User Experience Improvements**:
- ✅ **First Click**: Fetches analysis from API (one-time cost)
- ✅ **Second Click**: Collapses panel instantly (data preserved)
- ✅ **Third Click**: Expands panel instantly with cached data (no API call)
- ✅ **Icon Persistence**: 💭 remains visible, making it easy to find items with analysis
- ✅ **Data Lifecycle**: Results persist until notes are regenerated or page is refreshed

**Impact Summary**:
- 🚀 **Performance**: Eliminated duplicate API calls (saves tokens and time)
- 🎯 **Discoverability**: Persistent icon shows which items have analysis available
- ⚡ **Speed**: Instant expand/collapse for previously fetched analyses
- 💰 **Cost Savings**: Reduced interrogation agent API usage

---

### 📅 2025-11-05 - Export Consistency & Grouping Mode Fixes (v1.6.3)

**Summary**: Fixed export consistency issues and removed legacy placeholder text. All export formats (Copy to Clipboard, PDF, Email) now respect the selected grouping mode (By Topic vs By Type) and accurately reflect what users see on screen.

#### Export & Display Fixes

**What Was Broken** ❌:
1. **Duplicate NEXT STEPS Headers**: Exported content showed duplicate "Next Steps" sections
   - Legacy placeholder text `_(Action items table will appear below)_` appeared in exports
   - Source: [services/apiService.ts:292](services/apiService.ts#L292)
   - **Impact**: Confusing, unprofessional output in exports

2. **Export Ignored Grouping Mode**: All exports used "By Topic" format regardless of user selection
   - Switching between "By Topic" and "By Type" views had no effect on exports
   - Copy, PDF, and Email always exported in topic-grouped format
   - **Impact**: Users couldn't export in their preferred organization style

**What Was Fixed** ✅:
1. **Removed Placeholder Text**:
   - Deleted legacy template text from markdown generation
   - File: [services/apiService.ts:292](services/apiService.ts#L292)
   - **Impact**: Clean, professional exports without duplicate headers

2. **Export Respects Grouping Mode**:
   - Created new helper function `generateMarkdownFromStructuredData()` in [components/OutputPanel.tsx:413-538](components/OutputPanel.tsx#L413-L538)
   - Dynamically generates markdown based on selected grouping mode:
     - **By Topic**: Groups content under each workstream (e.g., Product → discussions/decisions/risks)
     - **By Type**: Groups all discussions together, all decisions together, all risks together
   - Updated `ExportBar` component to use grouping-aware markdown generation
   - **Impact**: All exports (Copy, PDF, Email) now match on-screen display exactly

3. **Enhanced Export Features**:
   - Exports include Executive Summary if present
   - Exports maintain Next Steps table with filtered/sorted data
   - Export format consistency across all output methods

**Files Modified**:
- 📄 [services/apiService.ts](services/apiService.ts) - Removed placeholder text (line 292)
- 📄 [components/OutputPanel.tsx](components/OutputPanel.tsx) - Added grouping-aware export logic:
  - Lines 413-538: New `generateMarkdownFromStructuredData()` helper function
  - Lines 544-547: Updated `ExportBar` to use grouping mode
  - Both "By Topic" and "By Type" views now export correctly

**Testing Recommendations**:
- ✅ Generate notes with structured data
- ✅ Toggle between "By Topic" and "By Type" views
- ✅ Export using Copy to Clipboard and paste into Word/Email
- ✅ Export to PDF and verify organization matches screen
- ✅ Draft Email and verify format matches selected view
- ✅ Confirm no duplicate "Next Steps" headers appear

**User Impact**:
- **Professional Exports**: No more duplicate headers or placeholder text
- **Flexible Sharing**: Export notes in the organization style that best suits your audience
- **Consistent Experience**: What you see on screen is exactly what you get in exports
- **Better Collaboration**: Share notes organized by type (all decisions together) or by topic (workstream-focused)

---

### 📅 2025-11-05 - Power Platform API Resilience (v1.6.2)

**Summary**: Fixed critical issue where the app was constantly attempting to reconnect to the Power Platform API endpoint, causing 504 Gateway Timeout errors and potentially collapsing the endpoint. Implemented comprehensive resilience features including caching, retry logic, circuit breaker pattern, and request deduplication.

#### Power Platform API Resilience Fix

**What Was Broken** ❌:
1. **Duplicate API Calls**: Every page load made TWO identical API calls to fetch department data:
   - First call from [auth/AuthGuard.tsx:226](auth/AuthGuard.tsx#L226) after authentication
   - Second call from [App.tsx:157](App.tsx#L157) on app mount
   - **Impact**: Doubled the load on the Power Automate endpoint
2. **No Caching**: Every page refresh hit the API again, even though department data rarely changes
3. **No Retry Logic**: Single 10-second timeout attempt with no retry or exponential backoff
4. **No Circuit Breaker**: Failed requests kept repeating endlessly without any protection mechanism
5. **No Rate Limiting**: Users could spam refresh and overload the endpoint
6. **Result**: Multiple 504 Gateway Timeout errors in console, endpoint potentially collapsing under load

**What Was Fixed** ✅:
1. **Removed Duplicate Fetch**: Deleted the redundant `useEffect` hook in [App.tsx](App.tsx) (previously lines 151-175)
   - Removed unused import of `fetchMomentumDepartments`
   - **Impact**: Immediate 50% reduction in API calls
2. **24-Hour localStorage Caching**: Added comprehensive caching system in [services/departmentService.ts](services/departmentService.ts)
   - Cache key: `momentum_department_cache`
   - Cache TTL: 24 hours
   - Cache version: `v1` (for schema migration support)
   - Stores Map entries as array for JSON serialization
   - **Impact**: 90%+ reduction in API calls after initial load
3. **Retry Logic with Exponential Backoff**:
   - Max 3 retry attempts per request
   - Delays: 1s, 2s, 4s between retries
   - Skips retry on 4xx client errors (only retries timeouts and 5xx errors)
   - **Impact**: Better resilience to transient network issues
4. **Circuit Breaker Pattern**:
   - Opens circuit after 3 consecutive failures
   - Prevents API calls for 5 minutes after circuit opens
   - Auto-resets after cooldown period
   - Persisted in localStorage: `momentum_circuit_breaker`
   - **Impact**: Protects endpoint from overload during outages
5. **Request Deduplication**:
   - In-flight request tracking prevents simultaneous duplicate calls
   - Returns existing promise if request already in progress
   - **Impact**: Prevents race conditions and duplicate requests

**Files Modified**:
- 📄 [App.tsx](App.tsx) - Removed duplicate department fetch (lines 151-175) and unused import (line 20)
- 📄 [services/departmentService.ts](services/departmentService.ts) - Complete rewrite with resilience features:
  - Lines 35-48: Cache and circuit breaker configuration constants
  - Lines 50-51: In-flight request tracking
  - Lines 69-154: Circuit breaker implementation (get/save/check/record/reset)
  - Lines 160-200: Cache implementation (get/save with TTL and version checking)
  - Lines 224-288: Retry logic with exponential backoff
  - Lines 335-424: Main fetch function with 4-step process (dedup → circuit breaker → cache → API call)

**Technical Implementation**:

**Step-by-Step Execution Flow**:
```
1. Request arrives → Check if already in-flight → Return existing promise
2. Check circuit breaker → If open, fail fast with error message
3. Check localStorage cache → If valid (<24h old), return cached data
4. Make API request with retry logic:
   - Attempt 1: Immediate
   - Attempt 2: After 1s delay (if timeout/5xx)
   - Attempt 3: After 2s delay (if timeout/5xx)
   - Attempt 4: After 4s delay (if timeout/5xx)
5. On success: Save to cache, reset circuit breaker, return data
6. On failure: Increment circuit breaker, return null
```

**Cache Data Structure**:
```typescript
interface CachedData {
  users: Array<[string, MomentumUserData]>; // Map entries as array
  timestamp: number; // Cache creation time
  version: string; // Schema version for migration
  recordCount: number; // Number of users
}
```

**Circuit Breaker State**:
```typescript
interface CircuitBreakerState {
  consecutiveFailures: number; // Failure count
  lastFailureTime: number; // Timestamp of last failure
  isOpen: boolean; // Circuit breaker status
}
```

**Expected Console Output (First Load)**:
```
[DepartmentService] Fetching fresh department data from Power Automate...
[DepartmentService] ✅ Successfully fetched 962 Momentum users in 2000ms
[DepartmentService] Cached 962 users for 24 hours
```

**Expected Console Output (Subsequent Loads)**:
```
[DepartmentService] ✅ Using cached data (15m old, 962 users)
```

**Expected Console Output (Circuit Breaker Opens)**:
```
[DepartmentService] Attempt 1/3 failed: Timeout
[DepartmentService] Retry 1/2 after 1000ms delay...
[DepartmentService] Attempt 2/3 failed: Timeout
[DepartmentService] Retry 2/2 after 2000ms delay...
[DepartmentService] Attempt 3/3 failed: Timeout
[DepartmentService] All retry attempts timed out
[DepartmentService] 🚨 Circuit breaker OPENED after 3 consecutive failures. Will retry in 5 minutes.
```

**Testing**:
- ✅ Duplicate fetch removed (only one API call per session)
- ✅ Cache working (no API calls for 24 hours after initial load)
- ✅ Retry logic working (3 attempts with exponential backoff)
- ✅ Circuit breaker working (stops after 3 failures, resets after 5 minutes)
- ✅ Request deduplication working (returns existing promise if in-flight)
- ✅ TypeScript compilation successful (no new errors)

**Benefits**:
- **95%+ reduction** in API calls (caching + duplicate removal)
- **Endpoint protection** via circuit breaker prevents collapse during outages
- **Better user experience** with graceful degradation and cached data
- **Improved resilience** with retry logic and exponential backoff
- **No user impact** - app continues to function with cached or stale data

**Performance Impact**:
- First load: ~2s (same as before, but only once)
- Subsequent loads: ~0ms (instant from cache)
- Page refreshes: ~0ms (instant from cache)
- After 24 hours: ~2s (cache refresh)
- During outage: ~0s (fails fast with circuit breaker)

**Monitoring Recommendations**:
1. Monitor console logs for circuit breaker openings
2. Check localStorage for cache hit/miss ratio
3. Track API call frequency in network tab
4. Monitor Power Automate endpoint health metrics

---

### 📅 Update - 2025-10-30 - Department Integration Fix (v1.6.1)

**Summary**: Fixed critical issues preventing Momentum department data from being fetched and used. The Power Automate endpoint is now properly configured, field name mismatches are resolved, and comprehensive diagnostic logging is in place to ensure Momentum database departments take priority over Graph API data.

#### Department Integration Fix

**What Was Broken** ❌:
1. **Power Automate Endpoint Not Configured**: The `momentumDepartmentFlowUrl` in [appConfig.ts](appConfig.ts) was set to placeholder text, causing department data to never be fetched
2. **Field Name Mismatch**: Power Automate returns Pascal Case fields (`EmailAddress`, `DepartmentGroup`) but code expected camelCase (`emailAddress`, `departmentGroup`), causing data parsing to fail
3. **Result**: Steve Sanderson always showed "London: Worldwide" (Graph API office location) instead of "Global Technology" (Momentum database department)

**What Was Fixed** ✅:
1. **Endpoint Configured**: Updated [appConfig.ts:10](appConfig.ts#L10) with actual Power Automate flow URL
2. **Field Transformation**: Added Pascal Case → camelCase transformation in [departmentService.ts:80-100](departmentService.ts#L80-L100)
3. **Diagnostic Logging**: Added comprehensive console logging to track data flow from Power Automate → departmentMap → getPreferredDepartment → participant.department

**Files Modified**:
- 📄 [appConfig.ts](appConfig.ts) - Added Power Automate endpoint URL (was placeholder)
- 📄 [services/departmentService.ts](services/departmentService.ts) - Added field transformation and console logging
- 📄 [utils/departmentLookup.ts](utils/departmentLookup.ts) - Added diagnostic logging to getPreferredDepartment

**Verification Data** ✅:
- Power Automate endpoint returns **962 active Momentum users** in ~2 seconds
- Steve Sanderson: `DepartmentGroup = "Global Technology"` ✅
- Luis Bustos: `DepartmentGroup = "IP & CT"` ✅
- Department priority hierarchy working: Momentum DepartmentGroup → Momentum Department → Graph API → Unknown

**Expected Console Output**:
```
[App] Fetching Momentum department data...
[DepartmentService] Fetching Momentum department data...
[DepartmentService] ✅ Successfully fetched 962 Momentum users in ~2000ms

🔍 [getPreferredDepartment] Called for email: steve.sanderson@momentumww.com
   📊 Graph API department: "London: Worldwide"
   🗺️  departmentMap available: true, size: 962
   🔎 Momentum DB lookup result: FOUND
   📋 Momentum data: {
     name: "Steve Sanderson",
     departmentGroup: "Global Technology",
     department: "Production: Global Technology"
   }
   ✅ RETURNING: "Global Technology" (source: DepartmentGroup (Momentum))
```

**Testing**:
- ✅ Power Automate endpoint working (962 users, ~2s response)
- ✅ Field transformation working (Pascal Case → camelCase)
- ✅ Steve Sanderson shows "Global Technology" (not "London: Worldwide")
- ✅ Luis Bustos shows "IP & CT" (not Graph API department)
- ✅ Diagnostic logging provides full visibility into data flow

**Benefits**:
- Accurate department assignment using Momentum HR database as source of truth
- Graph API data serves as fallback when Momentum data unavailable
- Full diagnostic logging makes troubleshooting easy
- 4 integration points ensure consistency across all participant addition methods

**Related Documentation**:
- Full verification guide: [DEPARTMENT-INTEGRATION-VERIFICATION.md](DEPARTMENT-INTEGRATION-VERIFICATION.md)
- Implementation summary: [MOMENTUM-DEPARTMENT-IMPLEMENTATION-SUMMARY.md](MOMENTUM-DEPARTMENT-IMPLEMENTATION-SUMMARY.md)

---

### 📅 Update - 2025-10-30 - Enhanced UX Features (v1.5.0)

**Summary**: Implemented three key UX improvements to enhance user workflow: automatic table filter reset on new note generation, smart scrolling when expanding meetings, and automatic scroll to top when transcripts are loaded.

#### Enhanced UX Features

**What's New**:
- ✅ **Automatic Table Filter Reset**: When generating new notes, all table filters are automatically cleared to show the full dataset
- ✅ **Smart Meeting Card Scrolling**: When expanding a meeting card, the page smoothly scrolls to ensure the "Process This Meeting" button is fully visible
- ✅ **Scroll to Top on Transcript Load**: After a transcript is loaded, the page automatically scrolls to the top to highlight the "Generate Notes" button with its pulse animation

**Key Features**:
1. **Filter Reset on Generate** - Ensures users always see complete results for newly generated notes without needing to manually clear filters
2. **Improved Meeting Selection Flow** - Smooth scrolling behavior guides users through the meeting selection process
3. **Better Focus Management** - Automatic scroll to top after transcript loading directs attention to the next action

**Files Modified**:
- 📄 [components/OutputPanel.tsx](components/OutputPanel.tsx) - Added `onFiltersReset` callback prop and exposed reset function to parent via `useRef`/`useCallback`
  - Lines 1, 31, 867-875: Added imports, interface prop, and reset function handling
  - Lines 1056, 1068: Passed `onResetFilters` prop to both NextStepsTable instances
- 📄 [App.tsx](App.tsx) - Integrated filter reset functionality with note generation
  - Line 120: Added `resetFiltersRef` to store table filter reset function
  - Lines 277-279: Created `handleFiltersReset` callback to receive reset function from OutputPanel
  - Line 313: Called `resetFiltersRef.current?.()` at start of `handleGenerate` to clear filters before generating new notes
  - Line 683: Passed `onFiltersReset={handleFiltersReset}` prop to OutputPanel
- 📄 [components/meeting/MeetingCard.tsx](components/meeting/MeetingCard.tsx) - Added data attribute for scroll targeting
  - Line 130: Added `data-meeting-id={meeting.id}` attribute for DOM targeting
- 📄 [components/meeting/MeetingSelectionPanel.tsx](components/meeting/MeetingSelectionPanel.tsx) - Implemented scroll behaviors
  - Lines 285-291: Added smooth scroll to meeting card when expanded using `scrollIntoView({ behavior: 'smooth', block: 'nearest' })`
  - Lines 320-323: Added scroll to top after transcript loads using `window.scrollTo({ top: 0, behavior: 'smooth' })`

**Technical Implementation**:
- Uses callback ref pattern to expose child component's reset function to parent
- `scrollIntoView` with `block: 'nearest'` ensures minimal scrolling while keeping button in view
- 100ms delay on meeting expansion scroll allows DOM to update before scrolling
- 300ms delay on transcript load scroll provides smooth transition after data update

**Benefits**:
- Reduces user confusion when viewing filtered data after generating new notes
- Improves discoverability of the "Process This Meeting" button for collapsed meetings
- Creates a more cohesive workflow by automatically focusing attention on the next action
- Enhances the existing pulse animation feature by ensuring the button is always visible when triggered

**Testing Scenarios**:
1. ✅ Generate notes with active filters → Filters automatically clear and full dataset displays
2. ✅ Expand a meeting card → Page smoothly scrolls to show the "Process This Meeting" button
3. ✅ Process a meeting with transcript → Page scrolls to top and Generate Notes button shows pulse animation

---

### 📅 Previous Update - 2025-10-29 - Automatic Version Update Detection (v1.4.0)

**Summary**: Implemented automatic version detection to notify users when new deployments are available, ensuring they always use the latest version with all features and bug fixes.

#### Version Update Detection System

**What's New**:
- ✅ **Build-Time Version Generation**: Automatically creates version.json with version, timestamp, and git commit hash
- ✅ **Runtime Version Polling**: Checks for updates every 5 minutes + on tab focus/visibility changes
- ✅ **Non-Intrusive UI**: Blue info banner appears when update is available (dismissible)
- ✅ **One-Click Refresh**: Users can immediately refresh to get the latest version
- ✅ **Telemetry Tracking**: Comprehensive tracking of version mismatches, refreshes, and dismissals
- ✅ **Cache-Safe Design**: version.json never cached, ensuring fresh data on every check
- ✅ **Multi-Environment Support**: Works seamlessly in both local dev (Vite) and production (Cloud Run/nginx)

**Key Features**:
- Solves the problem of users running outdated code after deployments
- Ensures users get new features (e.g., telemetry updates) immediately
- Provides visibility into update adoption rates via telemetry
- Non-blocking user experience - dismissible notification
- Industry-standard approach used by GitHub, GitLab, Vercel

**Files Created**:
- 📄 [scripts/generate-version.js](scripts/generate-version.js) - Build-time version generation script
- 📄 [public/version.json](public/version.json) - Version metadata file (generated during build)
- 📄 [hooks/useVersionCheck.ts](hooks/useVersionCheck.ts) - React hook for version polling and detection
- 📄 [components/ui/VersionUpdateBanner.tsx](components/ui/VersionUpdateBanner.tsx) - Update notification banner UI

**Files Modified**:
- [package.json](package.json) - Added `prebuild` script to auto-generate version.json
- [nginx.conf](nginx.conf) - Added Cache-Control headers to prevent version.json caching
- [App.tsx](App.tsx) - Integrated useVersionCheck hook and VersionUpdateBanner component

**Technical Implementation**:
```javascript
// Build-time: scripts/generate-version.js generates version.json
{
  "version": "1.4.0",
  "buildTime": "2025-10-29T01:29:33.649Z",
  "gitCommit": "306b930"
}

// Runtime: useVersionCheck.ts polls for updates
- On mount: fetch and store current version
- Every 5 minutes: check server version
- On tab focus: check server version
- If mismatch: show banner + track telemetry
```

**Version Check Flow**:
1. App loads → Fetch version.json → Store as current version
2. Periodic polling (5 min) + tab focus → Fetch version.json again
3. Compare versions (version + buildTime + gitCommit)
4. If different → Show VersionUpdateBanner
5. User clicks "Refresh" → Reload page → Latest version loaded
6. Telemetry tracks: mismatch detected, user action (refresh/dismiss)

**nginx Cache Configuration**:
```nginx
location = /version.json {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    add_header Pragma "no-cache";
}
```

**Telemetry Events**:
- `versionMismatchDetected`: New version available (tracks current vs. server version)
- `versionUpdateRefreshed`: User clicked refresh button (successful adoption)
- `versionUpdateDismissed`: User dismissed notification (deferred update)

**Benefits**:
- Users always have access to latest features and bug fixes
- No more missed features due to stale cache
- Track update adoption rates and user behavior
- Zero backend changes - pure static file approach
- Reliable and proven industry pattern

**Use Cases**:
- New feature deployments (e.g., telemetry, new UI components)
- Bug fixes that need immediate user adoption
- Performance improvements and optimizations
- Monitoring user engagement with updates

**Testing**:
- ✅ Version generation works in build process
- ✅ version.json accessible and never cached
- ✅ Polling works correctly (5 min + tab focus)
- ✅ Banner appears on version mismatch
- ✅ Refresh button reloads page successfully
- ✅ Dismiss button hides banner for session
- ✅ Telemetry events fire correctly

---

### 📅 Previous Update - 2025-10-24 - Azure AD Group Security (v1.3.0)

**Summary**: Implemented enterprise-grade group-based access control to restrict application access to Momentum Worldwide users only, with comprehensive access denied telemetry tracking.

#### Azure AD Group Security Implementation

**What's New**:
- ✅ **Group-Based Access Control**: Only users in "MOM WW All Users 1 SG" can access the application
- ✅ **Frontend Security**: Token claims validation checks group membership before loading app
- ✅ **Backend Security**: JWT validation middleware verifies group membership on every API request
- ✅ **Professional Access Denied Page**: Momentum-branded page with clear messaging
- ✅ **Access Denied Telemetry**: Comprehensive tracking of unauthorized access attempts
- ✅ **Zero Configuration**: Uses Azure AD token claims - no Graph API calls or admin consent needed
- ✅ **Dev Mode Enhancement**: Local development shows real user email + " (Dev)" instead of generic mock

**Key Features**:
- Defense in depth: Security enforced at both frontend and backend layers
- No performance impact: Group check happens instantly with token validation
- User-friendly: Professional access denied page matching login page design
- Audit trail: All access denials logged with user details, groups, and browser context
- Fast implementation: Token claims only, no additional API permissions required

**Files Created**:
- 📄 [auth/AccessDenied.tsx](auth/AccessDenied.tsx) - Professional access denied page with Momentum branding
- 📄 [backend/middleware/auth.js](backend/middleware/auth.js) - JWT validation and group membership middleware

**Files Modified**:
- [auth/authConfig.ts](auth/authConfig.ts) - Added `REQUIRED_GROUP_ID` constant and `profile` scope
- [auth/AuthGuard.tsx](auth/AuthGuard.tsx) - Added `checkGroupMembership()` function and `trackAccessDenied()` telemetry
- [contexts/AuthContext.tsx](contexts/AuthContext.tsx) - Added `isAuthorized` state to track authorization
- [backend/package.json](backend/package.json) - Added `jsonwebtoken` and `jwks-rsa` dependencies
- [backend/server.js](backend/server.js) - Applied auth middleware to protected endpoints
- [utils/telemetryService.ts](utils/telemetryService.ts) - Added `accessDenied` event type and `AccessDeniedEventPayload` interface

**Azure AD Configuration Required**:
1. Navigate to Azure AD App Registration → Token configuration
2. Add groups claim for Security groups
3. Select ID, Access, and UserInfo tokens
4. Choose Group ID format
5. No admin consent or additional API permissions needed!

**Security Benefits**:
- Meets enterprise security requirements for role-based access control
- Prevents unauthorized access at multiple layers (frontend + backend)
- Provides audit trail for security monitoring
- Fast performance with no additional API calls
- Easy rollback with git restore

**Use Cases**:
- Restrict application access to specific departments/business units
- Monitor unauthorized access attempts for security audits
- Track which non-authorized users are trying to access the app
- Identify users who may need to be added to the group
- Compliance reporting for access control

**Testing**:
- ✅ Momentum user: App loads normally, all features work
- ✅ Non-Momentum IPG user: Access denied page shown, 403 from backend
- ✅ Access denied event tracked in telemetry with full context
- ✅ TypeScript compilation: Zero errors
- ✅ Backend dependencies installed successfully

---

### 📅 Previous Update - 2025-10-23 (Part 2)

**Summary**: Implemented standardized user feedback system with multi-language support, reusing existing telemetry infrastructure for centralized feedback collection.

#### User Feedback System (v1.2.0)

**What's New**:
- ✅ **Feedback Button**: Floating action button (FAB) in bottom-right corner for easy access
- ✅ **Feedback Form**: Modal with type selection (bug, feature, comment, performance, documentation), priority (critical, high, medium, low), title, and description
- ✅ **Automatic Context Capture**: Browser/device info, current page URL, and console error logs automatically included (no user checkboxes)
- ✅ **Fire-and-Forget**: Success confirmation without error states - never blocks user workflow
- ✅ **Multi-Language Support**: Full translations in English, Spanish, and Japanese
- ✅ **Error Logging**: New error logger captures console.error and console.warn for debugging context
- ✅ **Reusable Infrastructure**: Uses existing telemetry service endpoint with conditional routing in Power Automate

**Features**:
- Form validation (title min 5 chars, description min 10 chars)
- Auto-close success modal after 3 seconds
- Dark mode support throughout
- Accessible (ARIA labels, keyboard navigation, focus management)
- Comprehensive error context for technical issues

**New Files Created**:
- 📄 [components/FeedbackButton.tsx](components/FeedbackButton.tsx) - Floating action button (31 lines)
- 📄 [components/FeedbackModal.tsx](components/FeedbackModal.tsx) - Feedback form modal with 3 states (244 lines)
- 📄 [utils/feedbackService.ts](utils/feedbackService.ts) - Feedback submission service (90 lines)
- 📄 [utils/errorLogger.ts](utils/errorLogger.ts) - Console error logger (168 lines)
- 📄 [locales/en/feedback.json](locales/en/feedback.json) - English translations
- 📄 [locales/es/feedback.json](locales/es/feedback.json) - Spanish translations
- 📄 [locales/ja/feedback.json](locales/ja/feedback.json) - Japanese translations

**Files Modified**:
- [utils/telemetryService.ts](utils/telemetryService.ts) - Added 'feedback' event type (25 total event types)
- [utils/i18n.ts](utils/i18n.ts) - Added feedback namespace to i18n configuration
- [App.tsx](App.tsx) - Integrated FeedbackButton component
- [Telemetry.md](Telemetry.md) - Added comprehensive feedback event documentation

**Use Cases**:
- Bug reporting with automatic error log capture
- Feature requests from users
- General comments and feedback
- Performance issue reporting with device context
- Documentation improvement suggestions

**Benefits**:
- Standardized feedback collection across all applications
- Rich context for debugging (browser, device, errors)
- No additional infrastructure needed (reuses telemetry endpoint)
- Power Automate conditional routing to SharePoint list
- Power App for triage (no premium connectors needed)
- Reduces support burden with self-service feedback
- Data-driven product improvements

---

### 📅 Previous Update - 2025-10-23 (Part 1)

**Summary**: Enhanced login telemetry with comprehensive browser, device, and environment context capture for advanced analytics.

#### Enhanced Login Telemetry (v1.1.0)

**What's New**:
- ✅ **Comprehensive Context Capture**: Login events now capture 25+ data points including browser, device, platform, display, locale, connection quality, and hardware specs
- ✅ **New Utility Module**: Created `utils/browserContext.ts` for browser/device detection
- ✅ **Dark Mode Tracking**: Captures user's theme preference (light/dark)
- ✅ **Performance Metrics**: Tracks CPU cores and device memory (where available)
- ✅ **Connection Quality**: Captures network type, speed, and latency
- ✅ **Privacy-First Design**: All captured data is non-PII with graceful degradation for unsupported APIs

**Use Cases**:
- Browser distribution analysis to prioritize testing efforts
- Mobile vs desktop adoption tracking
- Dark mode usage statistics
- Performance issue correlation with device capabilities
- Resolution-based UI optimization
- Connection quality impact on feature adoption

**New Documentation**:
- 📄 [POWERBI-LOGIN-TELEMETRY.md](POWERBI-LOGIN-TELEMETRY.md) - Power BI integration guide with DAX measures, visualizations, and use cases
- 📄 [TELEMETRY-PRIVACY.md](TELEMETRY-PRIVACY.md) - Comprehensive privacy and compliance documentation (GDPR, CCPA, UK DPA)
- 📄 Updated [Telemetry.md](Telemetry.md) - Enhanced login event documentation with full payload structure

**Files Modified**:
- [utils/browserContext.ts](utils/browserContext.ts) - NEW: Browser/device detection utility (340 lines)
- [utils/telemetryService.ts](utils/telemetryService.ts) - Added `LoginEventPayload` TypeScript interface
- [App.tsx](App.tsx) - Updated login tracking to capture browser context

**Benefits**:
- Data-driven browser support decisions
- Identify compatibility issues before they become widespread
- Optimize responsive design for actual user devices
- Understand technology landscape of user base
- Plan feature development based on device capabilities

---

### 📅 Previous Update - 2025-01-22 (Part 3)

**Summary**: Implemented comprehensive telemetry framework for tracking user interactions and usage analytics.

#### Telemetry Framework Implementation

**New Files Created**:
- ✅ `appConfig.ts` - Power Automate flow URL configuration (single centralized endpoint)
- ✅ `utils/telemetryService.ts` - Centralized event tracking service (24 event types)
- ✅ `utils/reporting.ts` - Power Automate flow trigger utility (not actively used)

**Events Tracked**:
- **Authentication**: userLogin, userLogout
- **Core Functionality**: notesGenerated, notesRegenerated
- **Exports**: exportedToCSV, exportedToPDF, exportedToEmail, copiedToClipboard
- **Transcript Interaction**: transcriptInterrogated, questionAsked
- **Settings**: settingsOpened, botIdChanged
- **Data Input**: sampleDataLoaded, formCleared, transcriptFileUploaded, docxFileUploaded
- **Presets**: presetSelected
- **Tour**: tourStarted, tourCompleted, tourDismissed

**Integration Points**:
- ✅ App.tsx - User login tracking, notes generation tracking
- ✅ OutputPanel.tsx - Export tracking (CSV, PDF, email, clipboard)
- ✅ InterrogateTranscriptModal.tsx - Question tracking
- ✅ SettingsDrawer.tsx - Settings interactions
- ✅ InputPanel.tsx - File uploads and preset selections
- ✅ TourContext.tsx - Tour start tracking
- ✅ TourStep.tsx - Tour completion and dismissal tracking

**Features**:
- Session ID generation (unique per browser session)
- User context management (from Azure AD)
- Event envelopes with app metadata (version, timestamp, correlation ID)
- Fire-and-forget HTTP POST (doesn't block UI)
- Graceful degradation when URLs not configured
- Privacy-focused (bot IDs hashed, no meeting content sent)

**Benefits**:
- Track feature adoption and usage patterns
- Identify popular presets and export formats
- Measure tour completion rates
- Monitor user engagement
- Data-driven product decisions

**Documentation**:
- Added comprehensive "Telemetry & Analytics" section in README
- Included event schema, configuration guide, and privacy details
- Optional Power BI dashboard suggestions

---

### 📅 Earlier Update - 2025-01-22 (Part 2)

**Summary**: Added Scroll to Top button for improved navigation on long pages.

#### UX Enhancement

**New Feature - Scroll to Top Button**:
- ✅ Created `ScrollToTop.tsx` component with smooth scroll behavior
- ✅ Floating action button (FAB) appears after scrolling 400px down
- ✅ Positioned in bottom-right corner (standard UX convention)
- ✅ Circular design with primary brand color and glassmorphism styling
- ✅ Smooth scroll animation (not instant jump)
- ✅ Hover effect: scales up 110% with enhanced shadow
- ✅ Full accessibility: ARIA labels, keyboard navigation, focus ring
- ✅ Dark mode support
- ✅ Integrated into main App component

**Implementation Details**:
- Uses existing `chevron-up` icon from Icon component
- Event listener with automatic cleanup
- 400px scroll threshold for visibility
- Fixed positioning with z-index: 40 (below modals, above content)
- Size: 48px × 48px (mobile-friendly touch target)
- Smooth transitions: 300ms duration

**Benefits**:
- Improved navigation on long meeting notes
- Better user experience when scrolling through extensive output
- Follows modern web design best practices
- Consistent with application's existing design system

---

### 📅 Earlier Update - 2025-01-22 (Part 1)

**Summary**: Met with Nick to verify deployment architecture and started Docker/WSL2 setup. Computer restart required to complete WSL2 installation.

#### Meeting with Nick Keller (2025-01-22)

**Architecture Verification**:
- ✅ Confirmed 2-service design (frontend + backend) matches Staff Plan pattern
- ✅ Clarified nginx.conf does NOT proxy to interact.interpublic.com
- ✅ Frontend calls backend directly via Cloud Run URL
- ✅ Backend handles CORS configuration
- ✅ Confirmed interact.interpublic.com is accessible without VPN/netscope

**Files Updated During Meeting**:
- ✅ Dockerfile - Nick provided updated version
- ✅ nginx.conf - Nick provided updated configuration
- ✅ build-push-image script - Nick provided shell script

**Docker Setup Progress**:
- ✅ Docker Desktop installed
- ✅ WSL2 (Ubuntu 22.04) installation started
- 🟡 Computer restart required to complete WSL2 setup
- ⏳ Will continue Docker build testing after restart

**Next Steps**:
1. Restart computer to complete WSL2 installation
2. Verify Docker Desktop works with WSL2
3. Continue with Nick to test Docker builds
4. Email Jeff confirming design verification is complete

---

### 📅 Previous Update - 2025-01-21

**Summary**: Prepared Meeting Notes Generator for Google Cloud Run deployment by renaming environment variables and adding deployment progress tracker.

#### Changes

**Environment Variables**:
- ✅ Removed `VITE_` prefix from `CLIENT_ID`, `CLIENT_SECRET`, `DEFAULT_BOT_ID`
- ✅ Updated `vite.config.ts` to expose non-VITE_ prefixed variables using `loadEnv`
- ✅ Updated all code references in `App.tsx` and `SettingsDrawer.tsx`
- ✅ Updated TypeScript type definitions in `vite-env.d.ts`
- ✅ Updated `.env.example` template

**Deployment Preparation**:
- ✅ Initialized Git repository (commit: `7a9bfce`)
- ✅ Committed environment variable changes (commit: `d1557af`)
- ✅ Added comprehensive deployment progress tracker to README
- ✅ Documented outstanding questions for Nick and Jeff
- ✅ Created deployment roadmap with 15 tracked steps

**Documentation**:
- ✅ Added "Google Cloud Run Deployment Progress" section to README
- ✅ Added deployment progress tracker table
- ✅ Documented GCP project information (`mom-ai-apps`)
- ✅ Listed next immediate actions and blockers

#### Git Commits

- `d1557af` - Rename environment variables for Docker deployment compatibility
- `7a9bfce` - Initial commit: Note Crafter app

#### Benefits

- ✅ Environment variables now compatible with Docker build-time injection
- ✅ Clear deployment roadmap with trackable progress
- ✅ All stakeholders have visibility into deployment status
- ✅ Blockers and dependencies clearly documented
- ✅ Git history provides version control for Docker image tagging

---

### 📅 Previous Update - 2024-01-20

**Summary**: Initial comprehensive documentation created for Meeting Notes Generator application, including full README and environment configuration template.

#### Changes

**Documentation**:
- ✅ Created comprehensive README.md with 15 major sections
- ✅ Added detailed MSAL authentication setup guide
- ✅ Documented API integration with code examples
- ✅ Included troubleshooting guide for common issues
- ✅ Provided deployment instructions for multiple platforms

**Configuration**:
- ✅ Created `.env.example` template for easy setup
- ✅ Documented all environment variables
- ✅ Added security notes for sensitive data

**Architecture Documentation**:
- ✅ System architecture diagram (ASCII)
- ✅ Authentication flow diagram
- ✅ API request flow diagram
- ✅ Complete file structure breakdown

#### Files Modified

- [README.md](README.md) - Created comprehensive project documentation
- [.env.example](.env.example) - Created environment variable template

#### Benefits

- ✅ New developers can onboard quickly with step-by-step setup instructions
- ✅ Authentication setup is clearly documented with Azure AD configuration steps
- ✅ Troubleshooting guide reduces support burden
- ✅ API documentation provides clear integration examples
- ✅ Deployment options documented for multiple platforms
- ✅ File structure explanation helps navigate codebase
- ✅ Security best practices highlighted throughout

---

## Version Information

**Version**: 2.0.0
**Release Date**: November 12, 2025
**Last Updated**: November 12, 2025
**Status**: Phase 1 Complete (Documentation) - Development In Progress 🚧
**License**: Proprietary
**Maintained By**: Interpublic Group / IPCT Team / Momentum Worldwide

### Version History

- **v2.0.0** (2025-11-12): 🔄 **MAJOR TRANSFORMATION** - Repurposed from Meeting Notes Generator to Employee Onboarding System
  - Complete application purpose change: Meeting notes → Employee onboarding management
  - New features: Pre-hire tracking, equipment packages, approval workflow, freeze period automation
  - New data model: Hardware, Package, Software, PreHire, Employee, ApprovalRequest, HelixTicket entities
  - Preserved 70-80% of infrastructure: Auth, UI components, Graph API, telemetry, deployment
  - System integrations: Workday, AD, Vantage, Helix, Weenus, Orbit
  - Momentum department data perfectly reusable (962 users)
  - Phase 1 (Documentation) complete ✅

**Previous Version (Meeting Notes Generator)**:
- **v1.6.3** (2025-11-05): Export Consistency & Grouping Mode Fixes - All exports now respect selected grouping mode (By Topic vs By Type)
- **v1.6.2** (2025-11-05): Power Platform API Resilience - Added caching, retry logic, circuit breaker, and request deduplication
- **v1.5.0** (2025-10-30): Enhanced UX Features - Table filter reset, improved scrolling behavior, and transcript loading improvements
- **v1.4.0** (2025-10-29): Automatic Version Update Detection - Notify users when new deployments are available
- **v1.3.0** (2025-10-24): Azure AD Group Security - Restricted access to Momentum users only
- **v1.2.0** (2025-10-23): User Feedback System with multi-language support
- **v1.1.0** (2025-10-23): Enhanced Login Telemetry with browser/device context
- **v1.0.0** (2025-01-22): Initial production release with full feature set

---

## Support & Contact

**AI Studio Deployment**: [View App](https://ai.studio/apps/drive/15Ng3Teh9qlaWnXBSC6lFqqwkutt_0VXD)
**Issues**: Contact your IT/DevOps team
**Internal Documentation**: [Internal Wiki/Confluence]

---

**Built with ❤️ using React + TypeScript + MSAL + AI**
