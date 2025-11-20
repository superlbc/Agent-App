---
allowed-tools: Bash, Glob, Grep, Read, Edit, Write, TodoWrite, mcp__playwright__browser_navigate, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_console_messages
description: Structured feature development workflow - from requirements to implementation to visual validation
---

You are guiding a structured feature development process. Use the Feature Developer agent to build complete features systematically.

## TASK

Call the `@agent-feature-developer` agent to build the requested feature.

## CONTEXT

**Git Status:**
```
!`git status`
```

**Recent Commits:**
```
!`git log --oneline -n 5`
```

## OBJECTIVE

Invoke the Feature Developer agent and provide it with all the context it needs:

```
@agent-feature-developer

Please build the following feature:

[Feature description from user]

## Requirements
- [Extract or ask user for specific requirements]
- [Include any acceptance criteria]
- [Note any UI/UX specifications]

## Context
- Recent git changes: [summarize from above]
- Existing codebase patterns: [note any relevant patterns]

Please follow your systematic development process:
1. Clarify requirements
2. Design architecture (database, API, frontend)
3. Create implementation plan
4. Build step by step
5. Validate visually with Playwright
6. Deliver working feature

Remember to:
- Test each layer before moving to the next
- Use Playwright for visual validation
- Follow design principles in /context/design-principles.md
- Use style guide patterns from /context/style-guide.md
- Ensure responsive design (mobile + desktop)
- Support light/dark themes
- Keep me updated via todo list
```

## INSTRUCTIONS

1. Review user's feature request
2. Gather any visible context (git status, recent changes)
3. Invoke the @agent-feature-developer with complete instructions
4. Let the agent handle the systematic development process
5. The agent will ask clarifying questions if needed
6. The agent will provide updates via todo list
7. The agent will deliver a complete, tested, visually-validated feature

## OUTPUT

Your response should be the agent invocation with the complete feature request and context.
