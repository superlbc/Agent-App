# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

This is a full-stack web application built for rapid corporate application development, focused on AI-powered knowledge assistance. The primary goal is to move quickly from idea to implementation while maintaining clean architecture and design standards.

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
- Microsoft Copilot Studio via Direct Line API
- Power Automate flows for personnel data
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

---

# Momentum Knowledge Assistant

> AI-powered knowledge base for Momentum employees

## Application Overview

**Momentum Knowledge Assistant** is a React-based chat application that provides AI-powered Q&A using Microsoft Copilot Studio. Employees can ask questions and access SharePoint documents through natural conversation, with department-based access control ensuring relevant content for their role.

### Key Features

- **AI-Powered Q&A**: Microsoft Copilot Studio integration via Direct Line API
- **Department-Based Access**: SharePoint content filtered by user's department
- **Multi-Tab Conversations**: Manage multiple chat threads simultaneously
- **Adaptive Card Responses**: Rich, interactive responses from the AI
- **Personnel Data Caching**: 24-hour localStorage caching for personnel data (962 Momentum users)
- **Azure AD Authentication**: Group-based access control with MSAL
- **Dark Mode Support**: Automatic theme switching based on user preference
- **Internationalization**: Multi-language support (English, Spanish, Japanese)

### Architecture

The application uses a modern React architecture with Microsoft cloud services:

**Frontend Stack:**
- React 18.2.0 + TypeScript 5.4.5
- Tailwind CSS (utility-first styling)
- MSAL Browser 3.10.0 (Azure AD authentication)
- Vite 5.2.11 (build tool)

**Backend Integration:**
- Microsoft Copilot Studio (AI agent)
- Direct Line API (WebSocket-based chat protocol)
- Power Automate (personnel data lookup)
- Azure AD (authentication and group membership)

**Data Flow:**
```
User Browser (React App)
    ↓
MSAL Authentication (Azure AD)
    ↓
Copilot Service (Direct Line API)
    ↓
Microsoft Copilot Studio
    ↓
SharePoint Documents (Department-Filtered)
```

### Core Services

| Service | Purpose | Key Features |
|---------|---------|--------------|
| **copilotService.ts** | Direct Line API integration | WebSocket connection, message handling, Adaptive Card rendering |
| **personnelService.ts** | Power Automate personnel lookup | Fetches 962 Momentum users, department mapping |
| **departmentService.ts** | Department caching and resilience | 24-hour localStorage cache, circuit breaker pattern, retry logic |
| **apiService.ts** | Generic API client | Token management, error handling (preserved for future integrations) |
| **telemetryService.ts** | Centralized event tracking | User actions, chat interactions, error monitoring |

### Department-Based Access Control

The application enforces access control at multiple levels:

1. **Azure AD Group Security**: Only users in "MOM WW All Users 1 SG" can access the application
2. **Department Filtering**: SharePoint content filtered by user's department from personnel data
3. **Personnel Data Source**: 962 Momentum users fetched from Power Automate flow
4. **Caching Strategy**: 24-hour localStorage cache with circuit breaker for resilience
5. **Fallback Mechanism**: Graph API fallback when Power Automate unavailable

**Department Hierarchy:**
- Primary: `DepartmentGroup` (from Momentum database)
- Secondary: `Department` (from Momentum database)
- Fallback: Graph API department
- Default: "Unknown" if all sources fail

### Personnel Data Caching

**Cache Configuration:**
- Cache Duration: 24 hours
- Cache Storage: localStorage (`momentum_department_cache`)
- Cache Version: v1 (for schema migration support)
- Record Count: 962 Momentum users

**Resilience Features:**
- Circuit Breaker: Opens after 3 consecutive failures, 5-minute cooldown
- Retry Logic: 3 attempts with exponential backoff (1s, 2s, 4s delays)
- Request Deduplication: Prevents simultaneous duplicate API calls
- Graceful Degradation: Falls back to Graph API or cached data

**Expected Performance:**
- First Load: ~2 seconds (API call)
- Subsequent Loads: ~0ms (instant from cache)
- After 24 Hours: ~2 seconds (cache refresh)
- During Outage: ~0s (fails fast with circuit breaker)

### Adaptive Card Support

The application supports rich Adaptive Card responses from Copilot Studio:

- Interactive buttons and inputs
- Formatted text with markdown
- Image and media embedding
- Action handlers (submit, open URL)
- Fallback rendering for unsupported features

### Conversation Management

**Multi-Tab Architecture:**
- Create unlimited chat tabs
- Rename tabs for organization
- Delete tabs (except the last one)
- Switch between tabs instantly
- Conversation history preserved per tab

**Message Types:**
- User messages (sent to Copilot)
- Bot messages (responses from Copilot)
- System messages (errors, notifications)
- Adaptive Cards (rich interactive content)

### Telemetry & Analytics

**Tracked Events:**
- Authentication: userLogin, userLogout, accessDenied
- Chat Interactions: messageSent, messageReceived, conversationStarted
- Tabs: tabCreated, tabRenamed, tabDeleted, tabSwitched
- Settings: settingsOpened, themeChanged
- Errors: apiError, connectionError

**Privacy Considerations:**
- No message content sent to telemetry (privacy-first)
- User context from Azure AD only (name, email, tenant)
- Session IDs for tracking usage patterns
- Browser/device context for analytics

### Azure AD Group Security

**Access Control:**
- Required Group: "MOM WW All Users 1 SG"
- Group ID: `2c08b5d8-7def-4845-a48c-740b987dcffb`
- Membership: 886 Momentum employees

**Security Layers:**
1. Frontend: Token claims validation checks group membership
2. Backend: JWT validation middleware (if backend service deployed)
3. Access Denied Page: Professional error page with Momentum branding

**Benefits:**
- Defense in depth (frontend + backend)
- No performance impact (token claims only)
- Audit trail (all access denials logged)
- User-friendly error messaging

### Environment Variables

**Required Configuration:**
```env
# Copilot Studio Direct Line API
COPILOT_DIRECT_LINE_SECRET="your-direct-line-secret"

# Power Automate Personnel Data Flow
PERSONNEL_LOOKUP_FLOW_URL="https://prod-xx.eastus.logic.azure.com/..."

# Azure AD Authentication
AZURE_AD_CLIENT_ID="your-client-id"
AZURE_AD_TENANT_ID="your-tenant-id"

# Telemetry (optional)
TELEMETRY_FLOW_URL="https://prod-xx.eastus.logic.azure.com/..."
```

### Development Workflow

**Local Development:**
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

**Testing Checklist:**
- ✅ MSAL authentication working
- ✅ Copilot conversation responding
- ✅ Personnel data loading (962 users)
- ✅ Department filtering working
- ✅ Multi-tab functionality
- ✅ Adaptive Cards rendering
- ✅ Dark mode toggle
- ✅ Error handling (API failures)

### Deployment

**Google Cloud Run:**
- Platform: Managed Cloud Run
- Region: us-east4
- Authentication: Allow unauthenticated (handled by Azure AD)
- Environment Variables: Set in Cloud Run console
- Build: Dockerfile included (Nginx + React SPA)

**Pre-Deployment:**
1. Update environment variables in Cloud Run
2. Test authentication with Azure AD
3. Verify Copilot Studio endpoint
4. Test personnel data flow
5. Run security scan

### Common Issues & Solutions

**Issue: Personnel Data Not Loading**
- Check Power Automate flow URL is configured
- Verify flow is enabled and running
- Check localStorage for cached data
- Review console logs for API errors

**Issue: Copilot Not Responding**
- Verify Direct Line secret is correct
- Check Copilot Studio bot is published
- Review browser console for WebSocket errors
- Ensure network allows WebSocket connections

**Issue: Access Denied**
- Verify user is in "MOM WW All Users 1 SG" group
- Check Azure AD token claims include group ID
- Review access denied telemetry logs
- Contact IT to add user to group

**Issue: Adaptive Cards Not Rendering**
- Check Adaptive Card JSON schema version
- Verify fallback rendering works
- Review console for parsing errors
- Test with simple card first

### File Structure

```
src/
├── components/
│   ├── chat/                    # Chat interface components
│   │   ├── ChatContainer.tsx    # Main chat layout
│   │   ├── ChatMessage.tsx      # Individual message rendering
│   │   ├── ChatInput.tsx        # User input field
│   │   ├── AdaptiveCard.tsx     # Adaptive Card renderer
│   │   └── TabManager.tsx       # Multi-tab conversation manager
│   ├── Header.tsx               # App header with user menu
│   └── ui/                      # Reusable UI components
│       ├── Button.tsx
│       ├── Icon.tsx
│       ├── Toast.tsx
│       └── LoadingSpinner.tsx
├── services/
│   ├── copilotService.ts        # Direct Line API integration
│   ├── personnelService.ts      # Power Automate personnel lookup
│   ├── departmentService.ts     # Department caching and resilience
│   ├── apiService.ts            # Generic API client (preserved)
│   └── telemetryService.ts      # Centralized event tracking
├── contexts/
│   ├── AuthContext.tsx          # Authentication state
│   └── ChatContext.tsx          # Chat conversation state
├── hooks/
│   ├── useLocalStorage.ts       # localStorage with React state sync
│   └── useCopilot.ts            # Copilot integration hook
├── utils/
│   ├── adaptiveCards.ts         # Adaptive Card utilities
│   ├── browserContext.ts        # Browser/device detection
│   └── errorLogger.ts           # Error logging
├── types.ts                     # TypeScript interfaces
├── constants.ts                 # App constants
└── appConfig.ts                 # Power Automate flow URLs
```

### Integration Points

**Microsoft Copilot Studio:**
- Direct Line API for real-time chat
- WebSocket connection for bidirectional communication
- Adaptive Cards for rich responses
- Authentication token refresh

**Power Automate:**
- Personnel data flow (962 Momentum users)
- Telemetry event logging
- Error notification flows

**Azure AD:**
- User authentication via MSAL
- Group membership validation
- Profile data (name, email, photo)
- Token refresh and management

**Microsoft Graph API:**
- Fallback for department lookup
- User profile enrichment
- Presence status (optional)

---

## Version Information

**Current Version**: 3.0.0
**Application**: Momentum Knowledge Assistant
**Last Updated**: January 7, 2026
**Status**: Active Development
**License**: Proprietary - Interpublic Group / Momentum Worldwide

### Version History

- **v3.0.0** (2026-01-07): 🔄 **Major Transformation** - Focused on AI-powered knowledge assistant
  - Removed all UXP (event management, campaign, venue) features
  - Removed employee onboarding system
  - Focused on AI-powered knowledge base with Microsoft Copilot Studio
  - Preserved authentication, UI components, telemetry infrastructure
  - Simplified navigation (chat interface + settings only)
  - Added multi-tab conversation management
  - Implemented department-based SharePoint access control
  - Enhanced personnel data caching with circuit breaker pattern

- **v2.0.0** (2025-11-12): 🚀 **UXP Platform Launch** - Employee onboarding system (deprecated)
- **v1.6.3** (2025-11-05): Export consistency and grouping mode fixes
- **v1.6.2** (2025-11-05): Power Platform API resilience with caching and circuit breaker
- **v1.5.0** (2025-10-30): Enhanced UX features
- **v1.4.0** (2025-10-29): Automatic version update detection
- **v1.3.0** (2025-10-24): Azure AD group security implementation
- **v1.2.0** (2025-10-23): User feedback system with multi-language support
- **v1.1.0** (2025-10-23): Enhanced login telemetry
- **v1.0.0** (2025-01-22): Initial Meeting Notes Generator release (deprecated)

### Architecture Evolution

The application has evolved through three major iterations:

1. **v1.x - Meeting Notes Generator**: AI-powered meeting transcription and analysis
2. **v2.x - UXP Platform**: Employee onboarding and event management
3. **v3.x - Knowledge Assistant**: AI-powered knowledge base with Copilot Studio (current)

**Preserved Infrastructure** (across all versions):
- ✅ Azure AD authentication with MSAL
- ✅ Group-based access control
- ✅ Personnel data integration (962 Momentum users)
- ✅ Department mapping and caching
- ✅ Telemetry framework
- ✅ UI component library
- ✅ Dark mode support
- ✅ Internationalization (i18n)
- ✅ Google Cloud Run deployment

---

## Support & Contact

**Issues**: Contact your IT/DevOps team
**Internal Documentation**: [Internal Wiki/Confluence]
**Copilot Studio**: [Microsoft Copilot Studio Portal](https://copilotstudio.microsoft.com/)

---

**Built with ❤️ using React + TypeScript + Microsoft Copilot Studio**
