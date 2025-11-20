---
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*)
description: Smart git commit with conventional format and helpful commit messages
model: haiku
---

You are creating a well-formatted git commit.

## STEP 1: Gather Context

**Git Status:**
```
!`git status`
```

**Staged Changes:**
```
!`git diff --cached`
```

**Unstaged Changes:**
```
!`git diff`
```

**Recent Commit Messages (for style reference):**
```
!`git log --oneline -n 5`
```

## STEP 2: Analyze Changes

Based on the diffs above:
1. Identify what changed (new feature, bug fix, refactor, docs, etc.)
2. Summarize the purpose (the "why", not the "what")
3. Note any important details

## STEP 3: Stage Files (if needed)

If there are unstaged changes that should be committed:
```bash
!git add [specific files or .]
```

## STEP 4: Create Commit Message

**Format:**
```
<type>: <short summary>

[Optional detailed description]

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- feat: New feature
- fix: Bug fix
- refactor: Code refactoring
- style: Formatting, styling
- docs: Documentation
- chore: Maintenance, config
- perf: Performance improvement

**Guidelines:**
- Short summary: 50 characters or less
- Use imperative mood ("add feature" not "added feature")
- Focus on "why" not "what"
- Be specific but concise

## STEP 5: Create Commit

```bash
!git commit -m "$(cat <<'EOF'
<type>: <summary>

<optional details>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## STEP 6: Verify

```bash
!git status
!git log --oneline -n 1
```

## EXAMPLE

```bash
!git commit -m "$(cat <<'EOF'
feat: add user authentication

Implement JWT-based authentication with login/logout flows.
Includes protected routes and token refresh mechanism.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## NOTES

- **DO NOT** commit if there are no changes
- **DO ask** if unclear what the changes are for
- **DO** run git status after committing to verify
- **DO NOT push** unless explicitly asked
