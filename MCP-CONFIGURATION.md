# MCP Configuration Guide

This guide explains how to configure Model Context Protocol (MCP) servers for Claude Code, particularly Playwright for visual validation.

## What are MCPs?

MCPs (Model Context Protocol servers) give Claude Code additional capabilities beyond built-in tools. Think of them as plugins that extend what Claude can do.

**Key MCPs for this framework:**
- **Playwright** - Browser automation for visual testing (ESSENTIAL)
- **Context7** - Documentation lookup (helpful)
- **GitHub** - GitHub integration (optional)

## Installing Playwright MCP

### Step 1: Install via Claude Code

The easiest way is through Claude Code's built-in MCP installer:

1. Open Claude Code
2. Type `/mcp` to see available MCPs
3. Look for "playwright" or "Microsoft Playwright MCP"
4. Follow the installation prompts

### Step 2: Manual Installation (Alternative)

If automatic installation doesn't work:

```bash
# Install Playwright MCP globally
npx @microsoft/mcp-playwright install

# Or add to your Claude Code configuration manually
```

### Step 3: Configuration

The MCP configuration lives in Claude Code's global settings (not project-specific).

**Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Add Playwright configuration:**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@microsoft/playwright-mcp"]
    }
  }
}
```

**Advanced Configuration (Optional):**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@microsoft/playwright-mcp",
        "--browser", "chromium",
        "--headed"
      ]
    }
  }
}
```

**Configuration Options:**
- `--browser chromium|firefox|webkit` - Choose browser
- `--headed` - Show browser window (vs headless)
- `--device "iPhone 15"` - Emulate specific device
- `--width 1440 --height 900` - Set viewport size

### Step 4: Verify Installation

After installing and configuring:

1. Restart Claude Code
2. Type `/mcp` - you should see Playwright listed
3. Test it:
```
Can you navigate to https://www.google.com and take a screenshot?
```

If it works, you're all set! ✅

## Project-Specific Usage

Once Playwright MCP is installed globally, your agents and slash commands in this project can use it automatically.

**Available Playwright Tools:**
- `mcp__playwright__browser_navigate` - Go to URL
- `mcp__playwright__browser_take_screenshot` - Capture screenshot
- `mcp__playwright__browser_console_messages` - Read console logs
- `mcp__playwright__browser_click` - Click elements
- `mcp__playwright__browser_fill_form` - Fill form fields
- `mcp__playwright__browser_resize` - Change viewport size
- `mcp__playwright__browser_evaluate` - Run JavaScript
- `mcp__playwright__browser_wait_for` - Wait for elements

## Common MCP Configurations

### For Local Development Testing

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@microsoft/playwright-mcp",
        "--headed",
        "--browser", "chromium"
      ]
    }
  }
}
```

**Why this config:**
- `--headed` - See what's happening in browser
- Useful for debugging visual tests

### For Fast Automated Testing

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@microsoft/playwright-mcp"
      ]
    }
  }
}
```

**Why this config:**
- Headless mode (faster)
- Good for CI/CD or quick validation
- Less resource intensive

### For Mobile Testing

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@microsoft/playwright-mcp",
        "--device", "iPhone 15"
      ]
    }
  }
}
```

**Why this config:**
- Emulates mobile device
- Good for mobile-specific testing

## Other Useful MCPs

### Context7 (Documentation)

Helpful for looking up framework documentation:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/mcp-context7"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@microsoft/playwright-mcp"]
    }
  }
}
```

**Usage:**
Claude can look up React, Tailwind, Next.js docs automatically.

### GitHub MCP (Optional)

For GitHub integration:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Troubleshooting

### Playwright Not Working

**Issue:** "Playwright MCP not found" or similar error

**Solutions:**
1. Restart Claude Code after adding config
2. Verify JSON syntax in config file
3. Try reinstalling:
   ```bash
   npx @microsoft/playwright-mcp install --force
   ```
4. Check Node.js is installed: `node --version` (need 16+)

### Browser Won't Start

**Issue:** Playwright can't launch browser

**Solutions:**
1. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```
2. Check permissions (firewall, antivirus)
3. Try different browser: `--browser firefox`

### Screenshots Not Saving

**Issue:** Screenshots taken but can't find them

**Solution:**
- Default location: Current working directory
- Specify full path: `path=/absolute/path/to/screenshot.png`
- Check pwd: `!pwd` to see where you are

### Slow Performance

**Issue:** Playwright is slow

**Solutions:**
- Use headless mode (remove `--headed`)
- Close other applications
- Test on smaller viewports
- Reduce screenshot frequency

## Best Practices

### 1. Use Headed Mode During Development

```json
"--headed"
```

**Why:** You can see what Claude is doing, easier to debug.

### 2. Use Headless in Production/CI

```json
// No --headed flag
```

**Why:** Faster, uses less resources.

### 3. Multiple Configurations (Advanced)

You can't have multiple configs in one file, but you can:
- Switch between configs for different use cases
- Use environment variables
- Have separate config files

### 4. Security

**Never commit:**
- GitHub tokens
- API keys
- Passwords

**In config files**

Keep sensitive values in environment variables:
```json
{
  "env": {
    "API_KEY": "${API_KEY}"
  }
}
```

## Integration with This Framework

### Agents Using Playwright

All agents that need visual validation have Playwright tools enabled:
- `@agent-feature-developer` - Uses for post-implementation validation
- `@agent-design-reviewer` - Core tool for visual testing
- `/design-review` slash command - Invokes Playwright extensively

### Automatic Visual Validation

With Playwright configured, Claude Code will automatically:
1. Navigate to localhost:3000 (or your dev server)
2. Take screenshots at multiple viewports
3. Check console for errors
4. Test interactions
5. Validate against design principles

### Workflow

```
1. Make UI changes
2. Run /design-review
3. Playwright automatically:
   - Navigates to pages
   - Takes screenshots (desktop/tablet/mobile)
   - Tests light/dark themes
   - Checks console errors
   - Validates responsive design
4. Get detailed visual feedback
5. Fix issues
6. Repeat until perfect
```

## Quick Reference

**Check if Playwright is installed:**
```
Type /mcp in Claude Code
```

**Test Playwright:**
```
Navigate to https://example.com and take a screenshot
```

**Common commands:**
```javascript
// Navigate
mcp__playwright__browser_navigate to http://localhost:3000

// Screenshot
mcp__playwright__browser_take_screenshot full_page=true path=screenshot.png

// Resize viewport
mcp__playwright__browser_resize width=375 height=667

// Check console
mcp__playwright__browser_console_messages

// Enable dark mode
mcp__playwright__browser_evaluate expression="document.documentElement.classList.add('dark')"
```

## Getting Help

**Official resources:**
- Playwright MCP: https://github.com/microsoft/playwright-mcp
- Claude Code docs: https://claude.com/code
- Playwright docs: https://playwright.dev

**Common questions:**
- "How do I install Playwright MCP?" - See Step 1 above
- "Where is the config file?" - See Step 3 above
- "Playwright not working?" - See Troubleshooting section

---

**Remember:** Playwright MCP is essential for the Design Reviewer agent and visual validation workflows. Install it first before using the design review features of this framework.
