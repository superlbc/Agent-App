---
allowed-tools: Bash, Glob, Grep, Read, TodoWrite, mcp__playwright__browser_navigate, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_console_messages, mcp__playwright__browser_resize, mcp__playwright__browser_evaluate
description: Comprehensive design review of recent UI changes using Playwright for visual validation
---

You are conducting a comprehensive design review of recent UI changes.

## CONTEXT GATHERING

**Git Status:**
```
!`git status`
```

**Modified Files (last 3 commits):**
```
!`git diff --name-only HEAD~3`
```

**Recent Commits:**
```
!`git log --oneline -n 5`
```

**Diff Content:**
```
!`git diff HEAD~3`
```

## OBJECTIVE

Call the `@agent-design-reviewer` agent to perform a thorough visual and UX review of the recent changes.

Provide the agent with:
1. List of changed files (from above)
2. Summary of what changed (from commits)
3. Which pages/components need visual testing
4. Any specific acceptance criteria to check

## AGENT INVOCATION

```
@agent-design-reviewer

Please review the following UI changes:

## Changed Files
[List relevant .jsx, .tsx, .css files from git diff]

## What Changed
[Summarize from commit messages]

## Pages/Components to Test
[Identify affected routes/pages]

## Review Checklist
Please conduct your comprehensive review including:
1. Visual validation at desktop (1440px), tablet (768px), and mobile (375px)
2. Light and dark theme testing
3. Accessibility audit (WCAG AA)
4. Console error checking
5. Responsive behavior verification
6. Component compliance with /context/design-principles.md
7. Code quality check against /context/style-guide.md

## Development Server
Server should be running at: http://localhost:3000
(If not running, please start it first)

Please provide:
- Screenshots at all viewports
- Detailed findings report
- Severity-classified issues
- Specific, actionable recommendations
```

## INSTRUCTIONS

1. Gather context from git (what changed, which files)
2. Identify which pages/components are affected
3. Invoke @agent-design-reviewer with complete context
4. Let the agent systematically test with Playwright
5. Agent will provide comprehensive review report

## NOTE

The agent will:
- Navigate to pages using Playwright
- Take screenshots at multiple viewports
- Test light/dark themes
- Check console for errors
- Provide detailed, actionable feedback
- Classify issues by severity

Your job is to set it up with the right context, then let it work systematically.
