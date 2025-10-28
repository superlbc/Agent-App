# Agent Test Analysis & JSON-Only Format Proposal

## Executive Summary

**Test Status:** ✅ Both normal mode and interrogation mode are functioning correctly

**Key Finding:** The agent currently returns markdown with embedded formatting (emojis, bold text, headings). To gain full control over presentation at the application level, we should transition to a JSON-only format that preserves semantic structure without prescribing visual styling.

---

## Test Results

### Normal Mode (Meeting Notes Generation)
- ✅ Successfully generates meeting notes
- ✅ Returns parseable JSON block with `next_steps`, `coach_insights`, and `suggested_questions`
- ✅ Markdown content is well-structured
- ⚠️ Formatting is prescribed by agent (emojis, bold, heading levels)

### Interrogation Mode (Q&A)
- ✅ Successfully answers questions
- ✅ Returns clean JSON-only response
- ✅ Complies with STRICT FENCE PROTOCOL (no text outside fences)
- ✅ Provides follow-up suggestions

---

## Current Output Structure

### Markdown Content Hierarchy
```
Meeting Title (h3 with 🔷🔷 emoji decorations)
├── Meeting Purpose (plain text)
├── WORKSTREAM NOTES (section heading with 🔷🔷)
│   ├── Workstream 1 (h4 with 🔸 emoji)
│   │   ├── 🎯 KEY DISCUSSION POINTS (bullets with inline **bold**)
│   │   ├── ✅ DECISIONS MADE (bullets)
│   │   └── ❓ RISKS OR OPEN QUESTIONS (bullets)
│   ├── Workstream 2 (h4 with 🔸 emoji)
│   └── Workstream 3 (h4 with 🔸 emoji)
├── NEXT STEPS (table format)
│   └── Columns: Department | Owner | Task | Due Date | Status | Status Notes
├── CRITICAL REVIEW (if enabled)
│   ├── Gaps / Missing Topics
│   ├── Risk Assessment
│   └── Unassigned / Ambiguous Tasks
└── (Machine-readable JSON block at end)
```

### Current JSON Block Structure
```json
{
  "next_steps": [...],
  "suggested_questions": [...],
  "coach_insights": {...}
}
```

---

## Issues Identified

### 1. **Formatting Prescribed by Agent**
- Emojis (🔷, 🔸, 🎯, ✅, ❓) are hardcoded in content
- Heading levels (h3, h4) are dictated by agent
- Bold text is baked into markdown without semantic tracking

**Impact:** App cannot change visual style without re-generating notes

### 2. **Inline Bold Text is Not Trackable**
Example from markdown:
```markdown
- **Casey** to mock up blanket and hat designs, due date is **2025-09-02**.
```

The agent bolds **names** and **dates**, but the JSON doesn't track *which words* are bold or *why* they're emphasized.

**Impact:** If we want to apply different styling (color, underline, etc.) or extract key entities programmatically, we can't do it from the JSON alone.

### 3. **Mixed Concerns: Structure + Presentation**
- `🔷🔷 WORKSTREAM NOTES 🔷🔷` mixes visual decoration with semantic section label
- Status emojis (🟩, 🟧) in table are presentation, not data

**Impact:** Hard to change icon set or use different UI paradigms (cards, accordions, etc.)

### 4. **Markdown Tables are Rigid**
- Fixed column order
- Emoji status column requires parsing

**Impact:** App can't easily reorganize, filter, or reformat without parsing markdown

---

## JSON-Only Format Proposal

### Design Principles
1. **Separation of concerns:** Structure and semantics in JSON; visual styling in app
2. **Explicit formatting markers:** Track which text is bold, emphasized, or highlighted
3. **Machine-readable:** Easy to filter, search, transform, and render differently
4. **Backward compatible:** Can still generate markdown from JSON if needed

### Proposed Schema

```json
{
  "meeting_title": "ACL Weekly Team Status – 8/26",
  "meeting_purpose": "Main footprint status? John reports we are green on talent booking.",

  "workstream_notes": [
    {
      "workstream_name": "ACL Nights Show",
      "key_discussion_points": [
        {
          "text": "Casey to mock up blanket and hat designs, due date is 2025-09-02.",
          "emphasis": [
            {"start": 0, "end": 5, "type": "person", "value": "Casey"},
            {"start": 50, "end": 60, "type": "date", "value": "2025-09-02"}
          ]
        },
        {
          "text": "Sarah, coordinate with the city on permits; check with legal@example.com before signing anything.",
          "emphasis": [
            {"start": 0, "end": 5, "type": "person", "value": "Sarah"}
          ]
        }
      ],
      "decisions_made": [],
      "risks_or_open_questions": []
    },
    {
      "workstream_name": "Main Footprint",
      "key_discussion_points": [
        {
          "text": "John reports we are green on talent booking.",
          "emphasis": [
            {"start": 0, "end": 4, "type": "person", "value": "John"},
            {"start": 20, "end": 25, "type": "status", "value": "green"}
          ]
        }
      ],
      "decisions_made": [],
      "risks_or_open_questions": []
    },
    {
      "workstream_name": "Side Stage",
      "key_discussion_points": [
        {
          "text": "Finalize the audio vendor by EOD Friday.",
          "emphasis": [
            {"start": 33, "end": 39, "type": "date", "value": "Friday"}
          ]
        },
        {
          "text": "Need a decision on the catering options for the VIP area.",
          "emphasis": []
        }
      ],
      "decisions_made": [
        {
          "text": "Bob will own the decision on catering.",
          "emphasis": [
            {"start": 0, "end": 3, "type": "person", "value": "Bob"}
          ]
        }
      ],
      "risks_or_open_questions": [
        {
          "text": "Catering options for the VIP area is a key risk if we don't lock it down.",
          "risk_level": "HIGH",
          "emphasis": []
        }
      ]
    }
  ],

  "next_steps": [
    {
      "department": "XD",
      "owner": "Casey",
      "task": "Mock up blanket and hat designs",
      "due_date": "2025-09-02",
      "status": "GREEN",
      "status_notes": ""
    },
    {
      "department": "General",
      "owner": "Sarah",
      "task": "Coordinate with the city on permits; check with legal@example.com before signing anything",
      "due_date": "Not specified",
      "status": "AMBER",
      "status_notes": "Missing due date"
    },
    {
      "department": "General",
      "owner": "Bob",
      "task": "Own the decision on catering",
      "due_date": "Not specified",
      "status": "AMBER",
      "status_notes": "Missing due date"
    },
    {
      "department": "General",
      "owner": null,
      "task": "Finalize the audio vendor",
      "due_date": "Friday",
      "status": "AMBER",
      "status_notes": "Missing owner and specific date"
    }
  ],

  "critical_review": {
    "gaps_missing_topics": [],
    "risk_assessment": [
      {
        "level": "HIGH",
        "description": "Catering options for the VIP area is a key risk if we don't lock it down."
      }
    ],
    "unassigned_ambiguous_tasks": [
      {
        "task": "Finalize the audio vendor",
        "suggested_department": "PM"
      }
    ]
  },

  "suggested_questions": [
    "Who is the point of contact for finalizing the audio vendor?",
    "What are the specific catering options Bob is considering?",
    "What is the latest date to decide on catering to avoid high risk?"
  ],

  "coach_insights": {
    "initiative": "Meeting Excellence",
    "style": "gentle",
    "strengths": [],
    "improvements": [
      {
        "text": "Consider assigning an owner and due date to the task 'Finalize the audio vendor'.",
        "emphasis": [
          {"start": 54, "end": 82, "type": "task", "value": "Finalize the audio vendor"}
        ]
      },
      {
        "text": "Aim to capture due dates for all action items; two tasks are missing due dates: 'Coordinate with the city on permits' and 'Own the decision on catering'.",
        "emphasis": []
      }
    ],
    "facilitation_tips": [],
    "metrics": {
      "agenda_coverage_pct": 100,
      "decision_count": 1,
      "action_count": 4,
      "actions_with_owner_pct": 75,
      "actions_with_due_date_pct": 25,
      "participants_estimated": 4,
      "top_speaker_share_pct": 100
    },
    "flags": {
      "participation_imbalance": true,
      "many_unassigned_actions": false,
      "few_decisions": true,
      "light_agenda_coverage": false
    }
  }
}
```

---

## Emphasis/Formatting Schema

Each text item can have an `emphasis` array that tracks formatting semantics:

```typescript
interface EmphasisMarker {
  start: number;        // Character start position (0-indexed)
  end: number;          // Character end position (exclusive)
  type: 'person' | 'date' | 'status' | 'task' | 'department' | 'monetary' | 'deadline' | 'risk' | 'general';
  value: string;        // The emphasized text itself
}

interface TextWithEmphasis {
  text: string;                  // Plain text content
  emphasis: EmphasisMarker[];    // Array of formatting markers
}
```

### Why This Approach?

1. **App controls rendering:** App can render `person` type as blue bold, `date` as red, `status` as a colored badge, etc.
2. **Semantic meaning preserved:** We know *why* something is emphasized, not just that it's bold
3. **Easy to extract:** Can programmatically extract all people, dates, or tasks without parsing markdown
4. **Flexible styling:** Different views can use different styles without re-generating content
5. **Accessible:** Screen readers can interpret semantic markers (e.g., "person: Casey")

### Alternative: Simpler Bold Tracking

If semantic types are too complex, we can simplify to just bold markers:

```json
{
  "text": "Casey to mock up blanket and hat designs, due date is 2025-09-02.",
  "bold": [
    {"start": 0, "end": 5},
    {"start": 50, "end": 60}
  ]
}
```

This preserves which words are bold without semantic meaning. App can apply bold styling consistently.

---

## Comparison: Current vs. Proposed

| Aspect | Current (Markdown + JSON) | Proposed (JSON-Only) |
|--------|---------------------------|----------------------|
| **Control** | Agent prescribes formatting | App controls all styling |
| **Flexibility** | Fixed emoji/heading structure | Render as cards, accordions, tables, etc. |
| **Bold text** | Baked into markdown | Explicit markers or semantic types |
| **Parsing** | Need to parse markdown | Direct JSON access |
| **Changeability** | Requires re-generation | Change styling instantly |
| **Searchability** | Text search only | Semantic queries (all people, all dates) |
| **Accessibility** | Markdown semantics only | Rich semantic context |

---

## Migration Path

### Phase 1: Update System Prompt (Immediate)
1. Remove emoji decorations from section headings
2. Add `workstream_notes` array to JSON output
3. Add `emphasis` arrays to text items
4. Remove markdown generation (JSON-only mode)

### Phase 2: Update App Rendering (Next)
1. Create React components to render JSON structure
2. Apply consistent styling via CSS/Tailwind
3. Test with existing data

### Phase 3: Enhance (Future)
1. Add semantic search (find all mentions of a person)
2. Add filtering (show only HIGH risks)
3. Add customizable themes
4. Add export to different formats (PDF, DOCX, etc.) from JSON

---

## Recommendations

### 1. **Decouple Interrogation Mode** ✅
- Interrogation mode is already clean and JSON-only
- Works perfectly as-is
- **Recommendation:** Create a separate agent for interrogation mode (simpler, more efficient)

### 2. **Transition to JSON-Only for Normal Mode** ✅
- Current markdown is rigid and limits app flexibility
- JSON-only gives full control over presentation
- **Recommendation:** Adopt the proposed JSON schema with emphasis markers

### 3. **Choose Emphasis Strategy**
Option A: **Semantic emphasis** (person, date, status, etc.)
  - Pros: Rich metadata, enables semantic search
  - Cons: More complex to implement

Option B: **Simple bold markers** (just start/end positions)
  - Pros: Simple, preserves current bold intent
  - Cons: Less semantic meaning

**Recommendation:** Start with **Option B (simple bold)** for immediate implementation, then enhance to Option A if needed.

### 4. **Updated System Prompt Guidance**

Key changes needed:
```
OUTPUT FORMAT (JSON-ONLY MODE):

Return a single fenced JSON block with NO markdown content.

{
  "meeting_title": "string",
  "meeting_purpose": "string",
  "workstream_notes": [
    {
      "workstream_name": "string",
      "key_discussion_points": [
        {"text": "string", "bold": [{"start": 0, "end": 5}]}
      ],
      "decisions_made": [...],
      "risks_or_open_questions": [...]
    }
  ],
  "next_steps": [...],
  "critical_review": {...},
  "suggested_questions": [...],
  "coach_insights": {...}
}

BOLD MARKERS:
- For each text field, include a "bold" array tracking which words should be bold
- Use character positions (0-indexed, end exclusive)
- Bold the following: person names, dates, monetary values, deadlines, status keywords
```

---

## Next Steps

1. **Review this analysis** and choose:
   - Emphasis strategy (semantic vs. simple bold)
   - JSON schema adjustments

2. **Update system prompt** to output JSON-only format

3. **Test with test agent** to validate new format

4. **Update app rendering** to consume new JSON structure

5. **Deploy** and validate in production

---

## Appendix: Test Files

All test outputs are saved in the root directory:
- `test-output-normal-mode-raw.txt` - Raw agent response
- `test-output-normal-mode-markdown.md` - Extracted markdown
- `test-output-normal-mode-parsed.json` - Parsed JSON block
- `test-output-interrogation-raw.txt` - Raw interrogation response
- `test-output-interrogation-parsed.json` - Parsed interrogation JSON

Run tests again with:
```bash
node test-agent-runner.js
```
