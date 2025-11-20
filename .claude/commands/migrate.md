---
allowed-tools: Bash, Glob, Grep, Read, Edit, Write, TodoWrite
description: Migrate patterns, components, or entire frameworks between projects
---

You are helping migrate code patterns, components, or frameworks from one project to another.

## STEP 1: Understand Migration Intent

Ask user:
```
What would you like to migrate?

Options:
1. Specific components (e.g., Button, Form components)
2. Utility functions (e.g., API service, validation helpers)
3. Design system / style guide
4. Entire project framework/boilerplate
5. Custom hooks
6. Configuration files (Tailwind, ESLint, etc.)

Please specify:
- What to migrate: [description]
- Source: [path or repository]
- Destination: [current project or new location]
- Purpose: [why migrating this]
```

## STEP 2: Invoke Migration Assistant

```
@agent-migration-assistant

Please help migrate the following:

## What to Migrate
[User's selection from above]

## Source
[Path or description of source]

## Destination
[Where it should go in current/new project]

## Context
- Current project structure: [run ls -R to show]
- Existing similar files: [search for related files]
- Dependencies: [check package.json]

## Migration Type
[Select one:]
- **Extract & Reuse**: Take existing code and make it reusable
- **Copy & Adapt**: Copy from another project and adapt to this one
- **Create Framework**: Build a starter template from proven patterns
- **Component Library**: Create organized library of reusable components

## Requirements
- Maintain functionality
- Update imports/dependencies
- Ensure compatibility with current project
- Document usage
- Test after migration

Please follow your systematic migration process.
```

## STEP 3: Context Gathering

**For extracting from current project:**
```bash
# Find relevant files
!find . -name "*.jsx" -o -name "*.tsx" | grep -E "(component|hook|util)"

# Check dependencies
!cat package.json
```

**For copying from another project:**
```
Please provide:
- Path to source files
- Or: description of what exists in other project

I'll help identify what to copy and how to adapt it.
```

## STEP 4: Migration Assistant Process

The agent will:
1. Analyze source code/patterns
2. Extract or copy relevant files
3. Generalize and parameterize
4. Update imports and dependencies
5. Adapt to destination project structure
6. Create documentation
7. Test integration

## COMMON MIGRATION SCENARIOS

### Scenario A: Component Library Creation

**User says:** "I want to create a reusable component library from my current project"

**Response:**
```
@agent-migration-assistant

Create a reusable component library from this project.

## Current Project Components
[List all .jsx/.tsx files in src/components]

## Goal
Extract and generalize the best components into a reusable library

## Structure to Create
/components-library/
  /ui/
  /layout/
  /hooks/
  index.js
  README.md

## Requirements
- Generalize hard-coded values
- Add comprehensive prop types
- Create usage documentation
- Include examples
- Make easily importable
```

### Scenario B: Pattern Migration

**User says:** "Copy the authentication pattern from my other project"

**Response:**
```
Please provide:
1. Path to the auth files in the other project
   OR
2. Description of how auth works there

I'll help migrate and adapt it to this project.

Typically this includes:
- Auth context/provider
- Login/logout API calls
- Protected route component
- Auth hooks (useAuth, useUser)
- Token management utilities

Which of these do you want to migrate?
```

### Scenario C: Framework Creation

**User says:** "Create a starter template for future projects"

**Response:**
```
@agent-migration-assistant

Create a project starter template/boilerplate.

## Source
Current project (proven patterns)

## What to Include
- Project structure
- Essential components (Button, Input, Card, etc.)
- Tailwind configuration
- Theme provider
- API utilities
- Common hooks
- CLAUDE.md (pre-configured)
- package.json with dependencies
- README with setup instructions

## Goal
New projects can start in minutes with this template

Please extract the best patterns and create a clean, documented starter template.
```

## STEP 5: Verification

After migration assistant completes:

**Check what was migrated:**
```bash
!git status
```

**Test imports:**
```
Verify the migrated code works:
1. Check for import errors
2. Test components render
3. Verify utilities function correctly
```

**Update documentation:**
```
Ensure README or docs updated with:
- What was migrated
- How to use it
- Any dependencies needed
- Examples
```

## OUTPUT FORMAT

**Migration Summary:**
```markdown
## Migration Complete ✅

**What was migrated:**
- [List of files/components/patterns]

**Location:**
- Source: [where it came from]
- Destination: [where it is now]

**Changes made:**
- [List modifications, adaptations]

**Dependencies added:**
- [List any new package.json dependencies]

**Documentation:**
- [Link to README or usage docs]

**Next steps:**
1. Test the migrated code
2. Update any imports in existing files
3. Review documentation
4. [Other project-specific steps]

**Usage example:**
\`\`\`jsx
[Show how to use the migrated code]
\`\`\`
```

## NOTES

- Always preserve attribution (keep original authors in comments if applicable)
- Test after migration before considering complete
- Update package.json with new dependencies
- Document what was migrated and how to use it
- Consider creating examples for complex migrations
