# Full-Stack Development Framework for Claude Code

A comprehensive, production-ready framework for building React + SQL web applications with Claude Code. Designed for solo developers who need to move quickly from idea to implementation while maintaining high quality standards.

## What This Framework Provides

### 🎯 Core Components

**1. CLAUDE.md** - The Brain
- Loaded with every Claude Code session
- Contains project context, tech stack, workflows
- Acts as permanent memory for the AI
- Pre-configured for your stack (React, Tailwind, SQL, Cloud Run)

**2. Design System**
- `/context/design-principles.md` - Comprehensive design standards
- `/context/style-guide.md` - Tailwind + React implementation patterns
- Responsive design (mobile, tablet, desktop)
- Light/dark theme support
- WCAG AA accessibility compliance

**3. Specialized Agents**
- `@agent-feature-developer` - Build complete features (database → API → frontend)
- `@agent-design-reviewer` - Visual validation with Playwright
- `@agent-migration-assistant` - Extract patterns, create reusable frameworks
- `@agent-security-scanner` - Find exploitable vulnerabilities

**4. Slash Commands**
- `/feature-dev` - Structured feature development
- `/design-review` - Quick visual validation
- `/migrate` - Pattern migration
- `/commit` - Smart git commits
- `/deploy-cloudrun` - Google Cloud Run deployment

**5. Configuration**
- `.claude/settings.json` - Pre-allowed commands, permissions
- `MCP-CONFIGURATION.md` - Playwright setup guide

## Quick Start

### 1. Copy Framework to Your Project

```bash
# Copy the .claude directory
cp -r .claude /path/to/your/project/

# Copy the context directory
cp -r context /path/to/your/project/

# Copy CLAUDE.md to your project root
cp CLAUDE.md /path/to/your/project/
```

### 2. Install Playwright MCP

Follow the guide in `MCP-CONFIGURATION.md`:

```bash
# Via Claude Code
Type: /mcp
Find: playwright
Install

# Or manually
npx @microsoft/playwright-mcp install
```

### 3. Customize CLAUDE.md

Update project-specific sections:
- Project overview
- Tech stack details (if different)
- Environment variables
- Deployment specifics

### 4. Start Building!

```
# In Claude Code, ask:
@agent-feature-developer Please build a user authentication system with:
- Login/logout functionality
- Protected routes
- JWT token management
- Remember me option

# Or use slash command:
/feature-dev

# Then describe your feature
```

## How It Works

### The Development Loop

1. **Idea** → Describe feature to @agent-feature-developer
2. **Planning** → Agent asks clarifying questions, creates plan
3. **Implementation** → Builds database → API → frontend systematically
4. **Visual Validation** → Automatically tests with Playwright
5. **Delivery** → Working, tested, production-ready feature

### Agent Orchestration

Agents can call other agents for specialized help:

```
@agent-feature-developer (building feature)
  ↓ (needs visual validation)
@agent-design-reviewer (checks UI/UX)
  ↓ (finds security concern)
@agent-security-scanner (validates security)
```

### Visual Validation Workflow

With Playwright MCP installed:

1. **Make UI changes**
2. **Run** `/design-review`
3. **Playwright automatically:**
   - Navigates to localhost:3000
   - Takes screenshots (desktop/tablet/mobile)
   - Tests light/dark themes
   - Checks console for errors
   - Validates responsive design
4. **Get detailed report** with screenshots and actionable fixes

## Framework Structure

```
your-project/
├── .claude/
│   ├── agents/
│   │   ├── feature-developer.md      # Primary development agent
│   │   ├── design-reviewer.md         # Visual validation agent
│   │   ├── migration-assistant.md     # Pattern extraction agent
│   │   └── security-scanner.md        # Security vulnerability scanner
│   ├── commands/
│   │   ├── feature-dev.md             # /feature-dev command
│   │   ├── design-review.md           # /design-review command
│   │   ├── migrate.md                 # /migrate command
│   │   ├── commit.md                  # /commit command
│   │   └── deploy-cloudrun.md         # /deploy-cloudrun command
│   └── settings.json                  # Permissions & preferences
├── context/
│   ├── design-principles.md           # Design standards
│   └── style-guide.md                 # Tailwind + React patterns
├── CLAUDE.md                          # Main AI memory/context
└── MCP-CONFIGURATION.md               # Playwright setup guide
```

## Usage Examples

### Building a Complete Feature

```
@agent-feature-developer

Build a contact form with:
- Name, email, message fields
- Client-side validation
- Server-side validation
- Store submissions in database
- Email notification to admin
- Success/error feedback to user
- Responsive design
- Dark mode support
```

**What happens:**
1. Agent asks clarifying questions
2. Designs database schema
3. Creates API endpoint
4. Builds React form component
5. Implements validation
6. Tests visually with Playwright
7. Delivers working feature

### Quick Design Review

```
/design-review
```

**What happens:**
1. Checks recent git changes
2. Identifies affected pages
3. Calls @agent-design-reviewer
4. Agent uses Playwright to:
   - Navigate to pages
   - Screenshot at 3 viewports
   - Test light/dark themes
   - Check console errors
5. Provides detailed report

### Creating Reusable Framework

```
@agent-migration-assistant

Create a reusable component library from this project including:
- All UI components (Button, Input, Card, etc.)
- Common hooks (useData, useForm)
- API utilities
- Theme provider
- Documentation
```

**What happens:**
1. Analyzes project components
2. Extracts best implementations
3. Generalizes and parameterizes
4. Creates library structure
5. Documents usage
6. Provides starter template

### Smart Git Commit

```
/commit
```

**What happens:**
1. Reviews git status and diff
2. Analyzes what changed
3. Creates conventional commit message
4. Commits with proper format
5. Co-authored by Claude

### Deploying to Cloud Run

```
/deploy-cloudrun
```

**What happens:**
1. Pre-deployment checks (git status, build)
2. Optional security scan
3. Optional design review
4. Deploys to Google Cloud Run
5. Provides service URL
6. Documents environment variables

## Best Practices

### 1. Use Plan Mode for Complex Features

```
Shift+Tab to enter plan mode

Then describe the feature
```

**Why:** Higher success rates, better architecture, fewer iterations

### 2. Always Validate Visually

After any frontend changes:
```
/design-review
```

**Why:** Catch visual bugs before users do

### 3. Build Reusable Patterns

When you solve a problem well:
```
@agent-migration-assistant

Extract [pattern] into reusable component/utility
```

**Why:** Speed up future projects

### 4. Codify Learnings

When Claude makes a mistake:
```
@claude add this to CLAUDE.md so you don't make this mistake again
```

**Why:** Continuous improvement, fewer repeated errors

### 5. Use Git Worktrees for Parallel Exploration

```bash
# Create worktree
git worktree add ../project-2 experiment-branch

# Run Claude in both
# Compare results
# Choose best approach
```

**Why:** Explore multiple solutions simultaneously

## Customization

### For Your Specific Tech Stack

**Update CLAUDE.md:**
- Change backend framework details (if not Node/Express)
- Update database specifics (PostgreSQL, MySQL, etc.)
- Modify deployment process (if not Cloud Run)

**Update design-principles.md:**
- Add your brand colors
- Include logo usage guidelines
- Add custom component patterns
- Modify typography if needed

**Update style-guide.md:**
- Add custom Tailwind classes
- Include project-specific components
- Add utility patterns you use

### For Your Workflow

**Modify agents:**
- Adjust prompts for your preferences
- Add/remove tools as needed
- Change models (opus/sonnet/haiku)

**Create custom slash commands:**
- Add commands for your specific workflows
- Include project-specific automation
- Create shortcuts for repetitive tasks

## Advanced Patterns

### Compound Engineering

Build each feature to make the next one easier:

1. **Build feature** with @agent-feature-developer
2. **Extract patterns** with @agent-migration-assistant
3. **Update CLAUDE.md** with learnings
4. **Next feature is easier** because patterns exist

**Result:** Exponential productivity gains

### Agent Swarms (Parallel Sub-Agents)

For large migrations or refactors:

```
@agent-migration-assistant

Migrate 50 components from old pattern to new pattern.
Use parallel sub-agents (10 at a time) for speed.
```

**Result:** Hours of work done in minutes

### Memory Synthesis

Keep a development diary:

```
@claude

After completing this feature, write a summary to
/context/development-log.md including:
- What worked well
- Challenges encountered
- Solutions discovered
- Patterns to reuse
```

**Result:** Searchable knowledge base

## Troubleshooting

### Playwright Not Working

**See:** `MCP-CONFIGURATION.md` troubleshooting section

**Quick fix:**
1. Restart Claude Code
2. Verify config: Type `/mcp`
3. Reinstall: `npx @microsoft/playwright-mcp install --force`

### Agent Not Following Design Principles

**Check:** Is `/context/design-principles.md` present?

**Fix:** Agents reference this file. Ensure it exists and is detailed.

### Too Many Permission Prompts

**Edit:** `.claude/settings.json`

**Add to autoApprove:**
```json
{
  "autoApprove": {
    "commands": [
      "npm run dev",
      "git status",
      // Add more commands
    ]
  }
}
```

### Features Not Visually Validated

**Ensure:** Playwright MCP is installed (see MCP-CONFIGURATION.md)

**Check:** Dev server is running before design review

## Migrating to New Projects

### Quick Start (Minutes)

```
1. Copy .claude/ directory
2. Copy context/ directory
3. Copy CLAUDE.md
4. Update CLAUDE.md project overview
5. Run: npm install (if using package.json)
6. Start building
```

### Full Migration (Hours)

```
@agent-migration-assistant

Create a complete starter template including:
- Project structure
- All reusable components
- Configuration files
- CLAUDE.md pre-configured
- README with setup instructions
```

**Use this template for all future projects**

## What Makes This Framework Special

### 1. Comprehensive from Day One
- Not just agents, but complete development workflow
- Design system included
- Visual validation built-in
- Security scanning ready

### 2. Battle-Tested Patterns
- Based on Anthropic's own workflows
- Incorporates Patrick Ellis design workflow
- Real-world proven in production apps

### 3. Speed + Quality
- Build features in minutes, not hours
- Maintain high visual and code quality
- Automated validation at every step

### 4. Solo Developer Optimized
- No coordination overhead
- Full-stack in one flow
- Architecture to deployment in single session

### 5. Compounding Returns
- Each feature makes next one easier
- Patterns extracted and reused
- Knowledge codified in CLAUDE.md

## Learning Resources

**Included in this framework:**
- `CLAUDE.md` - Development workflows
- `design-principles.md` - Design standards
- `style-guide.md` - Implementation patterns
- `MCP-CONFIGURATION.md` - Playwright setup
- Agent markdown files - Detailed methodologies

**External resources:**
- Claude Code docs: https://claude.ai/code
- Playwright docs: https://playwright.dev
- Tailwind docs: https://tailwindcss.com
- React docs: https://react.dev

## Contributing Back

When you discover great patterns:
1. Extract with @agent-migration-assistant
2. Document in context/
3. Update CLAUDE.md
4. Share with others (optional)

## Support

**Questions about:**
- Framework structure → Check this README
- Playwright setup → See MCP-CONFIGURATION.md
- Agent usage → Read agent .md files
- Design standards → See design-principles.md
- Code patterns → See style-guide.md

## Next Steps

1. **Copy framework to your project** ✓
2. **Install Playwright MCP** ✓
3. **Customize CLAUDE.md** ✓
4. **Build your first feature** ← START HERE

```
@agent-feature-developer

Let's build [your first feature]!
```

---

**Remember:** This framework is your development accelerator. The more you use it, the faster you'll build. Each feature teaches the AI more about your preferences, creating a compounding effect where development gets faster and faster.

**Happy building!** 🚀
