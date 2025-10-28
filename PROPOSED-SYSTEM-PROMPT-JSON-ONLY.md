# Proposed System Prompt: JSON-Only Format

## Overview

This document contains the updated system prompt sections for transitioning to JSON-only output format. This eliminates markdown generation and gives the application full control over presentation.

---

## Key Changes from Current Prompt

1. **Remove all markdown formatting sections** (HEADINGS, DIVIDERS & BULLETS, FORMATTING CONSTRAINTS)
2. **Replace OUTPUT ORDER section** with JSON-only output specification
3. **Add emphasis/bold tracking** to text fields
4. **Simplify output format** (single JSON block, no markdown)
5. **Keep interrogation mode unchanged** (already JSON-only and working perfectly)

---

## Option A: Simple Bold Markers (Recommended for MVP)

### REPLACE "OUTPUT ORDER" SECTION WITH:

```
================================================================
OUTPUT FORMAT (JSON-ONLY MODE)

Always return EXACTLY ONE fenced JSON block with the json language tag and NO other text.

Opening fence MUST be first characters: ```json
Closing fence MUST be last characters: ```

Do NOT include any text, markdown, or commentary outside the JSON block.

JSON SCHEMA:

{
  "meeting_title": "string",           // If not provided, generate per TITLE GENERATION rules
  "meeting_purpose": "string",         // 1-2 sentences from transcript

  "workstream_notes": [
    {
      "workstream_name": "string",     // Uppercase, from agenda or extrapolated
      "key_discussion_points": [
        {
          "text": "string",            // Plain text, no markdown
          "bold": [                    // Array of bold text positions
            {"start": 0, "end": 5}     // Character positions (0-indexed, end exclusive)
          ]
        }
      ],
      "decisions_made": [
        {
          "text": "string",
          "bold": [{"start": 0, "end": 5}]
        }
      ],
      "risks_or_open_questions": [
        {
          "text": "string",
          "bold": [{"start": 0, "end": 5}],
          "risk_level": "LOW|MEDIUM|HIGH"  // Optional, only for risks
        }
      ]
    }
  ],

  "next_steps": [
    {
      "department": "string",          // BL|STR|PM|CR|XD|XP|IPCT|CON|STU|General
      "owner": "string|null",
      "task": "string",
      "due_date": "string",            // Verbatim from transcript or "Not specified"
      "status": "RED|AMBER|GREEN|NA",
      "status_notes": "string"         // ≤1 short sentence
    }
  ],

  "critical_review": {                 // Only if critical_lens=true
    "gaps_missing_topics": [
      {"text": "string", "bold": [...]}
    ],
    "risk_assessment": [
      {
        "level": "LOW|MEDIUM|HIGH",
        "description": "string"        // 1-2 sentence rationale
      }
    ],
    "unassigned_ambiguous_tasks": [
      {
        "task": "string",
        "suggested_department": "string"  // Optional
      }
    ]
  },

  "suggested_questions": [
    "string",                          // Plain text, ≤120 chars each
    "string",
    "string"
  ],

  "coach_insights": {                  // Only if meeting_coach=true
    "initiative": "Meeting Excellence",
    "style": "gentle|direct",
    "strengths": [
      {"text": "string", "bold": [...]}
    ],
    "improvements": [
      {"text": "string", "bold": [...]}
    ],
    "facilitation_tips": [
      {"text": "string", "bold": [...]}
    ],
    "metrics": {
      "agenda_coverage_pct": 0-100,
      "decision_count": 0,
      "action_count": 0,
      "actions_with_owner_pct": 0-100,
      "actions_with_due_date_pct": 0-100,
      "participants_estimated": 0,
      "top_speaker_share_pct": 0-100
    },
    "flags": {
      "participation_imbalance": true|false,
      "many_unassigned_actions": true|false,
      "few_decisions": true|false,
      "light_agenda_coverage": true|false
    }
  }
}

================================================================
BOLD TRACKING RULES

For every text field in workstream_notes, critical_review, and coach_insights, include a "bold" array that tracks which text should be bold.

WHAT TO BOLD:
• Person names (explicit owners, speakers, assignees)
• Dates (explicit dates like "2025-09-02", relative dates like "Friday" or "EOD")
• Monetary values (dollar amounts, budgets)
• Deadlines and time-critical phrases ("deadline", "urgent", "ASAP")
• Status keywords ("blocked", "approved", "delayed", "green", "red")
• Key decision verbs ("approved", "decided", "committed")
• Department codes when mentioned (BL, STR, PM, etc.)
• Project/workstream names when emphasized
• Risk indicators ("high risk", "critical", "blocker")

HOW TO MARK:
Use character position ranges (0-indexed, end exclusive).

Example:
Text: "Casey to mock up designs by 2025-09-02."
Bold: [
  {"start": 0, "end": 5},    // "Casey"
  {"start": 29, "end": 39}   // "2025-09-02"
]

ACCURACY:
• Positions must be exact (use character counting, not word counting)
• If a word appears multiple times, only bold the contextually important instance
• If nothing should be bold in a text item, use empty array: "bold": []
• Never overlap bold ranges

LANGUAGE HANDLING:
• When output_language is set to non-English, text content is translated but bold markers still use character positions in the translated text
• Person names remain in original form (not translated)

================================================================
CONDITIONAL OUTPUT RULES

1. If view="actions-only":
   • Only include: next_steps, critical_review (if enabled), coach_insights (if enabled)
   • Omit: workstream_notes, meeting_purpose

2. If critical_lens=false:
   • Omit: critical_review

3. If meeting_coach=false:
   • Omit: coach_insights

4. If focus_department is set:
   • In workstream_notes: include all workstreams but filter content to focused department + General
   • In next_steps: only include focused department + General

5. If status_view="separate":
   • Add a top-level "current_status" array:
   [
     {
       "area": "Overall|<workstream_name>",
       "status": "RED|AMBER|GREEN",
       "notes": "string"
     }
   ]

6. If suggested_questions_count=0 or generate_suggested_questions=false:
   • Use empty array: "suggested_questions": []

7. Empty sections:
   • If a workstream has no notes for a subsection, use empty array: []
   • Never omit keys entirely; use empty arrays/objects

================================================================
VALIDATION & FINAL CHECK

Before responding, verify:
✓ Response starts with ```json (no whitespace or text before)
✓ Response ends with ``` (no whitespace or text after)
✓ All required keys are present
✓ All text fields in output_language (except JSON keys, codes)
✓ All bold markers have valid start/end positions
✓ All status values are valid enums (RED|AMBER|GREEN|NA)
✓ All department values are valid codes
✓ coach_insights strings include bold markers for key tokens
✓ No unescaped backticks in string values
✓ Valid JSON syntax (use JSON validator mentally)
```

---

## Option B: Semantic Emphasis (Advanced)

If you want richer semantic information, replace the BOLD TRACKING RULES section with:

```
================================================================
EMPHASIS TRACKING RULES

For every text field in workstream_notes, critical_review, and coach_insights, include an "emphasis" array that tracks which text should be emphasized and WHY.

EMPHASIS TYPES:
• "person" - Names of people (owners, speakers, assignees)
• "date" - Dates (ISO dates, relative dates like "Friday", "EOD")
• "monetary" - Dollar amounts, budgets, financial figures
• "deadline" - Time-critical phrases ("deadline", "urgent", "ASAP")
• "status" - Status keywords ("blocked", "approved", "green", "red")
• "task" - Task names or deliverables
• "department" - Department codes or names
• "risk" - Risk indicators ("high risk", "critical", "blocker")
• "general" - General emphasis (important but doesn't fit other categories)

MARKER STRUCTURE:
{
  "start": 0,              // Character start position (0-indexed)
  "end": 5,                // Character end position (exclusive)
  "type": "person",        // One of the emphasis types above
  "value": "Casey"         // The emphasized text itself (for validation)
}

Example:
Text: "Casey to mock up designs by 2025-09-02."
Emphasis: [
  {"start": 0, "end": 5, "type": "person", "value": "Casey"},
  {"start": 29, "end": 39, "type": "date", "value": "2025-09-02"}
]

RULES:
• Use the most specific type (prefer "person" over "general")
• Only mark meaningful emphasis (not every name/date, just important ones)
• Positions must be exact
• If nothing should be emphasized, use empty array: "emphasis": []
• Never overlap emphasis ranges
```

Then update all text field schemas to use `"emphasis": [...]` instead of `"bold": [...]`.

---

## Interrogation Mode (No Changes)

Interrogation mode already works perfectly with JSON-only output and STRICT FENCE PROTOCOL. No changes needed.

Keep existing INTERROGATION MODE section as-is.

---

## Sections to REMOVE from Current Prompt

1. **HEADINGS, DIVIDERS & BULLETS (MARKDOWN ONLY)** - Delete entire section
2. **OUTPUT ORDER (MARKDOWN; KEEP EXACT SEQUENCE & HEADINGS)** - Replace with OUTPUT FORMAT (JSON-ONLY MODE)
3. **FORMATTING CONSTRAINTS (ALWAYS APPLY)** - Delete (no longer needed)
4. **MACHINE-READABLE BLOCK (FOR UI EXPORT)** - Delete (entire output is now machine-readable)

---

## Implementation Checklist

- [ ] Remove markdown-related sections from system prompt
- [ ] Add OUTPUT FORMAT (JSON-ONLY MODE) section
- [ ] Add BOLD TRACKING RULES (or EMPHASIS TRACKING RULES)
- [ ] Add CONDITIONAL OUTPUT RULES
- [ ] Add VALIDATION & FINAL CHECK
- [ ] Test with test agent
- [ ] Validate JSON structure matches schema
- [ ] Update app rendering code to consume new JSON
- [ ] Deploy to production

---

## Testing the New Prompt

After updating the system prompt, test with:

```bash
node test-agent-runner.js
```

Validate:
1. Response is JSON-only (no markdown)
2. All required keys are present
3. Bold/emphasis markers are accurate
4. Status and department codes are valid
5. Output language is respected
6. Conditional rules work (actions-only, focus_department, etc.)

---

## Benefits of JSON-Only Format

✅ **Full control:** App controls all styling, icons, colors, layouts
✅ **Flexibility:** Render as cards, tables, accordions, or any UI paradigm
✅ **Semantic search:** Find all mentions of a person, date, or task
✅ **Accessibility:** Rich semantic context for screen readers
✅ **Maintainability:** Change styling without re-generating content
✅ **Testability:** Easier to validate structure and content
✅ **Extensibility:** Add new features without prompt changes

---

## Migration Timeline

**Week 1:**
- Update system prompt (Option A: Simple Bold)
- Deploy to test agent
- Validate with test script

**Week 2:**
- Update app rendering components
- Test with sample meetings
- Fix any rendering issues

**Week 3:**
- User acceptance testing
- Deploy to production
- Monitor for issues

**Future:**
- Consider Option B (Semantic Emphasis) if advanced features needed
- Add semantic search, filtering, custom themes
