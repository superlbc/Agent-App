# UXP Migration - Parallel Agents Execution Guide

**Date**: November 22, 2025
**Purpose**: Execute remaining 6 agents in parallel to complete UXP migration
**Total Estimated Time**: 5-7 days (if run sequentially), **2-3 days (if run in parallel)**

---

## 📊 Agent Overview

| Agent | Priority | Est. Time | Can Run Parallel? | Dependencies |
|-------|----------|-----------|-------------------|--------------|
| **Agent 6** | 🔴 CRITICAL | 2-3 hours | No | None |
| **Agent 7** | 🟠 HIGH | 4-5 days | Yes | Agent 6 complete |
| **Agent 8** | 🟡 MEDIUM | 3-4 days | Yes | Agent 6 complete |
| **Agent 9** | 🟡 MEDIUM | 2-3 days | Yes | Agent 6 complete |
| **Agent 10** | 🟢 LOW | 2-3 days | Yes | Agents 7,8,9 complete |
| **Agent 11** | 🟢 LOW | 1-2 days | Yes | All agents complete |

---

## 🚀 Execution Strategy

### Phase 1: CRITICAL - Navigation Update (Sequential)

**Must complete first** - Blocks all other work

```bash
# Agent 6: Navigation Component Update
Task: Update Navigation.tsx from Employee Onboarding → UXP sections
Prompt File: AGENT-6-NAVIGATION-UPDATE-PROMPT.md
Duration: 2-3 hours
Blockers: None
Output: Updated Navigation.tsx, Updated App.tsx routing

# Command:
@agent-feature-developer --prompt-file AGENT-6-NAVIGATION-UPDATE-PROMPT.md --model sonnet
```

**Verification**:
- [ ] Navigation shows 8 UXP sections (not Employee Onboarding)
- [ ] Clicking sections loads correct components
- [ ] No console errors
- [ ] TypeScript compiles

---

### Phase 2: Core Features (Parallel - 3 Agents)

**Run simultaneously after Agent 6 complete**

```bash
# Agent 7: People & Team Management
Task: Build AssignmentManager, AvailabilityCalendar, TravelPlanner
Prompt File: AGENT-7-TEAM-COMPONENTS-PROMPT.md
Duration: 4-5 days
Blockers: Agent 6 complete
Output: 4 components + 1 service (1,850 lines)

# Agent 8: Integration Services
Task: Build Brandscopic, Placer, Smartsheet, QRtiger services
Prompt File: AGENT-8-INTEGRATION-SERVICES-PROMPT.md
Duration: 3-4 days
Blockers: Agent 6 complete
Output: 4 services + IntegrationDashboard (1,600 lines)

# Agent 9: Analytics Components (see below)
Task: Build CampaignPerformance, RegionalBreakdown, TeamUtilization, VenueMetrics
Prompt File: AGENT-9-ANALYTICS-COMPONENTS-PROMPT.md
Duration: 2-3 days
Blockers: Agent 6 complete
Output: 4 analytics components (1,200 lines)
```

**Commands** (run in parallel):
```bash
# Terminal 1
@agent-feature-developer --prompt-file AGENT-7-TEAM-COMPONENTS-PROMPT.md --model sonnet

# Terminal 2
@agent-feature-developer --prompt-file AGENT-8-INTEGRATION-SERVICES-PROMPT.md --model sonnet

# Terminal 3
@agent-feature-developer --prompt-file AGENT-9-ANALYTICS-COMPONENTS-PROMPT.md --model sonnet
```

**Verification**:
- [ ] All components build without errors
- [ ] No TypeScript compilation errors
- [ ] Components are accessible via navigation
- [ ] Mock data populates correctly

---

### Phase 3: Polish & Documentation (Parallel - 2 Agents)

**Run simultaneously after Phase 2 complete**

```bash
# Agent 10: Design Review
Task: Visual validation, responsive testing, accessibility audit
Prompt File: AGENT-10-DESIGN-REVIEW-PROMPT.md
Duration: 2-3 days
Blockers: Agents 7, 8, 9 complete
Output: Design review report with screenshots

# Agent 11: Documentation
Task: Create USER-GUIDE.md, ADMIN-GUIDE.md, DEVELOPER-GUIDE.md
Prompt File: AGENT-11-DOCUMENTATION-PROMPT.md
Duration: 1-2 days
Blockers: All agents complete
Output: 3 comprehensive documentation files
```

**Commands** (run in parallel):
```bash
# Terminal 1
@agent-design-reviewer --prompt-file AGENT-10-DESIGN-REVIEW-PROMPT.md

# Terminal 2
@agent-migration-assistant --prompt-file AGENT-11-DOCUMENTATION-PROMPT.md
```

**Verification**:
- [ ] Design review report exists with screenshots
- [ ] All documentation files created
- [ ] Documentation is comprehensive and accurate

---

## 📋 Detailed Agent Prompts

### Agent 9: Analytics Components (CREATE PROMPT)

**File**: `AGENT-9-ANALYTICS-COMPONENTS-PROMPT.md`

**Objective**: Build 4 analytics components to complement PowerBIDashboard and ReportExport

**Components**:
1. **CampaignPerformance.tsx** - Budget vs actual, event count, timeline
2. **RegionalBreakdown.tsx** - Events by region, map view, top cities
3. **TeamUtilization.tsx** - Assignments per person, workload distribution
4. **VenueMetrics.tsx** - Most used venues, Placer.ai aggregation

**Deliverables**: 4 components (~300 lines each = 1,200 total)

---

### Agent 10: Design Review (CREATE PROMPT)

**File**: `AGENT-10-DESIGN-REVIEW-PROMPT.md`

**Objective**: Comprehensive visual validation of all UXP components

**Tasks**:
1. **Visual Validation**:
   - Check all components match design system
   - Verify dark mode in all views
   - Test responsive design (desktop/tablet/mobile)
   - Take screenshots of all major views

2. **UX Review**:
   - Navigation flow (can users complete workflows?)
   - Form validation feedback
   - Loading states
   - Empty states
   - Toast notifications

3. **Accessibility**:
   - Keyboard navigation
   - ARIA labels
   - Color contrast (WCAG AA)
   - Focus indicators

4. **Performance**:
   - Large datasets (100+ campaigns, 500+ events)
   - Map rendering
   - Chart rendering

**Deliverables**: Design review report + screenshots

---

### Agent 11: Documentation (CREATE PROMPT)

**File**: `AGENT-11-DOCUMENTATION-PROMPT.md`

**Objective**: Create comprehensive end-user and developer documentation

**Documents**:
1. **USER-GUIDE.md**:
   - Getting started
   - Campaign management walkthrough
   - Event creation step-by-step
   - Venue database usage
   - Team assignment workflow
   - QR code generation
   - Analytics and reporting
   - FAQ

2. **ADMIN-GUIDE.md**:
   - System configuration
   - User role management
   - Integration setup
   - Database maintenance
   - Troubleshooting

3. **DEVELOPER-GUIDE.md**:
   - Architecture overview
   - Component hierarchy
   - State management
   - Adding new features
   - Testing strategy

**Deliverables**: 3 markdown files (30-50 pages total)

---

## ✅ Final Verification Checklist

After all agents complete:

### Navigation & Routing
- [ ] All 13 UXP sections display in navigation
- [ ] Each section loads correct component
- [ ] Active section highlighting works
- [ ] Navigation persists across refreshes

### Campaign Management
- [ ] Can create, edit, delete campaigns
- [ ] CampaignList displays with filters
- [ ] CampaignDetailView shows events
- [ ] Dark mode works

### Event Management
- [ ] EventCalendar shows events
- [ ] EventMap displays with markers
- [ ] EventList filters work
- [ ] Can create/edit events
- [ ] All 3 views accessible

### Venue Management
- [ ] VenueDatabase displays venues
- [ ] Can create/edit venues
- [ ] Search and filters work
- [ ] Placer.ai analytics show (mock data)

### Team Management
- [ ] AssignmentManager works
- [ ] AvailabilityCalendar shows conflicts
- [ ] TravelPlanner calculates distances
- [ ] Can assign people to events

### Integrations
- [ ] IntegrationDashboard shows all 4 integrations
- [ ] Manual sync triggers work
- [ ] QRCodeManager generates QR codes
- [ ] BrandscopicSyncStatus displays

### Analytics
- [ ] PowerBIDashboard loads
- [ ] ReportExport works
- [ ] CampaignPerformance displays
- [ ] RegionalBreakdown shows map
- [ ] TeamUtilization charts render
- [ ] VenueMetrics displays

### Admin
- [ ] UserManagement CRUD works
- [ ] ClientManagement CRUD works
- [ ] ProgramManagement CRUD works

### Visual & UX
- [ ] Dark mode works throughout
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors
- [ ] Loading states show
- [ ] Toast notifications work
- [ ] Empty states display

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No ESLint warnings
- [ ] All components use existing UI library
- [ ] Contexts properly integrated

### Documentation
- [ ] USER-GUIDE.md exists and is comprehensive
- [ ] ADMIN-GUIDE.md exists and is comprehensive
- [ ] DEVELOPER-GUIDE.md exists and is comprehensive
- [ ] All guides have screenshots
- [ ] FAQ sections complete

---

## 🎯 Success Metrics

**Completion Percentage**:
- Agent 6: 100% (navigation updated)
- Agent 7: 100% (team management complete)
- Agent 8: 100% (integration services complete)
- Agent 9: 100% (analytics components complete)
- Agent 10: 100% (design review complete)
- Agent 11: 100% (documentation complete)

**Overall**: 100% UXP Migration Complete 🎉

---

## 📞 Troubleshooting

### If Agent Fails

1. **Check logs**: Review error messages
2. **Check dependencies**: Ensure previous agents completed
3. **Manual intervention**: Fix blocking issues
4. **Restart agent**: Re-run prompt file

### If TypeScript Errors

1. **Check imports**: Ensure all components/types imported
2. **Check types.ts**: Verify all interfaces defined
3. **Run build**: `npm run build` to see all errors
4. **Fix incrementally**: Address one file at a time

### If Visual Issues

1. **Check dark mode classes**: Ensure `dark:` variants present
2. **Check Tailwind config**: Verify darkMode: 'class' enabled
3. **Test in browser**: Use DevTools to inspect styles
4. **Compare to working components**: Use existing components as reference

---

## 📊 Timeline Estimate

**Sequential Execution**: 15-20 days
**Parallel Execution**: 5-7 days

**Breakdown**:
- Day 1: Agent 6 (navigation) - 2-3 hours
- Day 1-5: Agents 7, 8, 9 (parallel) - 4-5 days
- Day 5-7: Agents 10, 11 (parallel) - 2-3 days

**Total**: 7 days maximum (if all agents run smoothly in parallel)

---

**Ready to execute? Start with Agent 6 (CRITICAL), then launch Agents 7, 8, 9 in parallel!** 🚀
