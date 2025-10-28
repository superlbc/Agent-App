# System Prompts Implementation Guide

## Overview

This document explains the new decoupled agent architecture with two specialized agents and provides implementation guidance.

---

## Architecture Change: One Agent → Two Agents

### Previous Architecture
**Single Agent** handling both:
- Meeting notes generation (complex, multi-step)
- Interrogation Q&A (simple, single-step)

**Problems:**
- Large, complex system prompt
- Mode switching logic adds complexity
- Harder to optimize/test each mode independently
- Interrogation mode simple logic buried in complex prompt

### New Architecture
**Two Specialized Agents:**

1. **Meeting Notes Generation Agent** (`SYSTEM-PROMPT-MEETING-NOTES-AGENT.md`)
   - Focused on structured notes generation
   - JSON-only output with semantic emphasis
   - RAG status, meeting coach, suggested questions
   - ~550 lines, highly structured

2. **Interrogation Agent** (`SYSTEM-PROMPT-INTERROGATION-AGENT.md`)
   - Focused on Q&A
   - JSON-only output with strict fence protocol
   - Simple, fast, reliable
   - ~350 lines, streamlined

**Benefits:**
- ✅ Simpler prompts (easier to maintain)
- ✅ Better performance (smaller context per agent)
- ✅ Independent testing and optimization
- ✅ Clear separation of concerns
- ✅ Easier to update one without affecting the other

---

## Agent 1: Meeting Notes Generation Agent

### Purpose
Generate structured meeting notes from transcripts with:
- Workstream notes (discussion points, decisions, risks)
- Action items with RAG status
- Critical review (if enabled)
- Meeting coach insights (if enabled)
- Suggested questions for interrogation

### Key Features

#### 1. JSON-Only Output (No Markdown)
**Rationale:** Give app full control over presentation, styling, and formatting.

**Before (Markdown):**
```markdown
🔸 ACL NIGHTS SHOW 🔸
🎯 **KEY DISCUSSION POINTS**
 - **Casey** to mock up designs
```

**After (JSON with Semantic Emphasis):**
```json
{
  "workstream_name": "ACL Nights Show",
  "key_discussion_points": [
    {
      "text": "Casey to mock up designs",
      "emphasis": [
        {"start": 0, "end": 5, "type": "person", "value": "Casey"}
      ]
    }
  ]
}
```

#### 2. Semantic Emphasis Tracking (Option B)
**Rationale:** Track WHY text is emphasized, not just that it's bold. Enables semantic search, rich metadata, and flexible rendering.

**Emphasis Types:**
- `person` - Names (for highlighting owners, speakers)
- `date` - Dates and deadlines (for timeline views)
- `status` - Status keywords (for status badges)
- `task` - Task names (for task tracking)
- `department` - Department codes (for department views)
- `monetary` - Dollar amounts (for budget tracking)
- `deadline` - Time-critical phrases (for urgency indicators)
- `risk` - Risk indicators (for risk dashboards)
- `general` - General emphasis (fallback)

**Use Cases:**
- Semantic search: "Find all mentions of Casey"
- Filtered views: "Show only HIGH risks"
- Custom styling: Render person names in blue, dates in red
- Accessibility: Screen readers can interpret semantic types
- Analytics: Track how many deadlines, risks, or owners mentioned

#### 3. Multi-Language Support
**Rationale:** Support global teams (Madrid office, Tokyo office, etc.)

- Supports English, Spanish (Spain variant), Japanese (keigo style)
- All text content translated
- JSON keys, codes, emphasis types remain English
- Preserves proper nouns and person names

#### 4. RAG Status Classification
**Rationale:** Deterministic, transcript-based status assignment for action items.

- **RED:** Blocked, overdue, high risk
- **AMBER:** At risk, missing owner/date, unclear
- **GREEN:** Clear owner, clear task, acceptable timeline
- **NA:** None of the above

**Triggers are explicit** (not inferred):
- RED: "blocked", "escalate", due date < meeting_date, "overdue"
- AMBER: missing owner, missing date, tentative wording, unclear
- GREEN: has owner, has task, no material risks

#### 5. Meeting Coach
**Rationale:** Improve meeting quality aligned to "Meeting Excellence" initiative.

**Heuristics:**
- Agenda coverage %
- Decision count
- Actions with owner/due date %
- Participation balance (top speaker share)
- Clarity signals (vague terms count)
- Risk hygiene (HIGH risks without mitigations)

**Coaching Style:**
- **Gentle:** "Consider...", "Try...", "Aim to..."
- **Direct:** "Assign...", "Define...", "Time-box..."

**Emphasis in Coach Text:**
All coach strings include emphasis markers for key tokens (names, dates, metrics).

#### 6. Suggested Questions
**Rationale:** Seed the interrogation modal with context-specific questions.

**Rules:**
- Grounded in transcript (use exact nouns/phrases)
- ≤120 characters each
- Prefer What/Who/Which/When/Why/How
- Variety: decisions/actions, risks, workstreams
- 0-5 questions (configurable)

#### 7. Conditional Output
**Rationale:** Flexible output based on controls.

**Supported Views:**
- `view="full"` → All sections
- `view="actions-only"` → Only next_steps + optional coach/critical

**Other Controls:**
- `critical_lens=true` → Include critical_review
- `meeting_coach=true` → Include coach_insights
- `status_view="separate"` → Add current_status array
- `focus_department=[XD]` → Filter to department + General

### Changes from Original Prompt

#### Removed:
- ❌ All markdown formatting sections (HEADINGS, DIVIDERS & BULLETS)
- ❌ Interrogation mode sections (moved to separate agent)
- ❌ `use_icons` flag handling (no longer relevant in JSON-only)
- ❌ `bold_important_words` flag (emphasis always tracked)
- ❌ OUTPUT ORDER with markdown structure
- ❌ STRICT FENCE PROTOCOL section (only needed for interrogation)

#### Added:
- ✅ OUTPUT FORMAT (JSON-ONLY MODE) section
- ✅ EMPHASIS TRACKING RULES with semantic types
- ✅ CONDITIONAL OUTPUT RULES (clearer specification)
- ✅ VALIDATION & FINAL CHECK with comprehensive checklist
- ✅ Explicit JSON schema with all fields documented
- ✅ Examples of emphasis in different languages

#### Enhanced:
- ✨ Output language rules more detailed
- ✨ RAG status rules more explicit
- ✨ Meeting coach rules with emphasis tracking
- ✨ Suggested questions rules with better heuristics

---

## Agent 2: Interrogation Agent (Q&A)

### Purpose
Answer user questions about meeting transcripts and suggest relevant follow-up questions.

### Key Features

#### 1. Strict Fence Protocol
**Rationale:** Clean JSON-only output with no extraneous text (easier parsing, no ambiguity).

**Rules:**
- First characters: ` ```json`
- Last characters: ` ``` `
- Nothing before opening fence
- Nothing after closing fence

**Self-check before responding:**
- Does response BEGIN with ` ```json`?
- Does response END with ` ``` `?
- If NO → REWRITE

#### 2. Transcript-Only Answers
**Rationale:** No hallucination, no inference. Only what's in the transcript.

**Logic:**
- If answer found → Provide concise answer (≤500 chars)
- If NOT found → Set `not_in_transcript=true`, state clearly

#### 3. Context-Specific Follow-Ups
**Rationale:** Help user explore the meeting naturally.

**Good patterns:**
- Drill-down: Task mentioned → "Who is responsible for [task]?"
- Ownership: Decision mentioned → "Who made the decision about [topic]?"
- Timing: Action mentioned → "When is [action] due?"
- Status: Project mentioned → "What is the status of [project]?"

**Use exact transcript nouns** (not generic):
- Good: "When is the audio vendor selection due?"
- Bad: "What is the timeline?"

#### 4. Multi-Language Support
Same as Meeting Notes Agent:
- English, Spanish, Japanese
- Answer and follow-ups translated
- JSON keys remain English

#### 5. Edge Case Handling
**Empty/unclear question:** Best-effort answer + clarifying follow-up
**Multiple sub-questions:** Answer all parts concisely
**Not in transcript:** State clearly + suggest related topics that ARE in transcript
**Ambiguous question:** Provide most likely interpretation + clarifying follow-up

### Changes from Original Prompt

#### Removed:
- ❌ Meeting notes generation logic (moved to other agent)
- ❌ All controls except `output_language`
- ❌ Workstream extraction, RAG status, meeting coach, etc.

#### Kept (from original interrogation mode):
- ✅ STRICT FENCE PROTOCOL
- ✅ JSON-only output format
- ✅ not_in_transcript flag
- ✅ follow_up_suggestions (1-2 items)
- ✅ Output language support

#### Enhanced:
- ✨ More detailed examples (4 examples with different scenarios/languages)
- ✨ Better follow-up heuristics with good/bad examples
- ✨ Edge case handling section
- ✨ Clear validation checklist

---

## Implementation Steps

### Step 1: Create Two Agents in Your Platform

1. **Clone your existing agent** or create new agents:
   - Agent 1: "Meeting Notes Generator"
   - Agent 2: "Meeting Interrogation"

2. **Copy system prompts:**
   - Agent 1 ← `SYSTEM-PROMPT-MEETING-NOTES-AGENT.md`
   - Agent 2 ← `SYSTEM-PROMPT-INTERROGATION-AGENT.md`

3. **Save Agent IDs:**
   - Note the new Agent IDs for both
   - Update your app config with both IDs

### Step 2: Update apiService.ts

#### Current Code Structure:
```typescript
// Single generateNotes function
// Single interrogateTranscript function
// Both use same botId
```

#### New Code Structure:
```typescript
// Two bot IDs in config
const apiConfig = {
  notesAgentId: 'xxx',
  interrogationAgentId: 'yyy'
};

// generateNotes uses notesAgentId
// interrogateTranscript uses interrogationAgentId
```

#### Specific Changes Needed:

**1. Update ApiConfig type** ([types.ts](types.ts)):
```typescript
export interface ApiConfig {
  hostname: string;
  clientId: string;
  clientSecret: string;
  notesAgentId: string;        // NEW: separate agent for notes
  interrogationAgentId: string; // NEW: separate agent for Q&A
  // botId: string;             // REMOVE: no longer a single bot
}
```

**2. Update generateNotes function** ([apiService.ts](apiService.ts)):
```typescript
export const generateNotes = async (
  payload: Payload,
  apiConfig: ApiConfig,
  signal?: AbortSignal
): Promise<AgentResponse> => {
  // Change: use apiConfig.notesAgentId instead of apiConfig.botId
  const agentUrl = `${baseUrl}/api/chat-ai/v1/bots/${apiConfig.notesAgentId}/messages`;

  // Rest of function remains the same
  // Response parsing will change (see Step 3)
}
```

**3. Update interrogateTranscript function** ([apiService.ts](apiService.ts)):
```typescript
export const interrogateTranscript = async (
  formState: FormState,
  question: string,
  apiConfig: ApiConfig
): Promise<InterrogationResponse> => {
  // Change: use apiConfig.interrogationAgentId instead of apiConfig.botId
  const agentUrl = `${baseUrl}/api/chat-ai/v1/bots/${apiConfig.interrogationAgentId}/messages`;

  // Rest of function remains the same (parsing already correct)
}
```

**4. Update App.tsx** ([App.tsx](App.tsx)):
```typescript
// OLD:
const [botId, setBotId] = useLocalStorage<string>('botId', defaultBotId);
const apiConfig: ApiConfig = {
  // ...
  botId: botId,
};

// NEW:
const [notesAgentId, setNotesAgentId] = useLocalStorage<string>(
  'notesAgentId',
  (import.meta.env)?.DEFAULT_NOTES_AGENT_ID || ''
);
const [interrogationAgentId, setInterrogationAgentId] = useLocalStorage<string>(
  'interrogationAgentId',
  (import.meta.env)?.DEFAULT_INTERROGATION_AGENT_ID || ''
);

const apiConfig: ApiConfig = {
  hostname: 'https://interact.interpublic.com',
  clientId: (import.meta.env)?.CLIENT_ID || '',
  clientSecret: (import.meta.env)?.CLIENT_SECRET || '',
  notesAgentId: notesAgentId,
  interrogationAgentId: interrogationAgentId,
};
```

**5. Update .env.local**:
```env
# OLD:
# DEFAULT_BOT_ID="64650431-dad7-4b47-8bb1-4a81800f9f5f"

# NEW:
DEFAULT_NOTES_AGENT_ID="<your-meeting-notes-agent-id>"
DEFAULT_INTERROGATION_AGENT_ID="<your-interrogation-agent-id>"
```

**6. Update Settings UI** ([SettingsDrawer.tsx](SettingsDrawer.tsx)):
```typescript
// Add two separate inputs for agent IDs
<Input
  label="Meeting Notes Agent ID"
  value={notesAgentId}
  onChange={(e) => setNotesAgentId(e.target.value)}
/>
<Input
  label="Interrogation Agent ID"
  value={interrogationAgentId}
  onChange={(e) => setInterrogationAgentId(e.target.value)}
/>
```

### Step 3: Update Response Parsing (generateNotes)

The new JSON-only format has a different structure. Update parsing in [apiService.ts](apiService.ts):

**Current parsing:**
```typescript
// Extracts markdown + JSON block at end
const fencedJsonRegex = /```(?:json|jsonc|json5)?\s*({[\s\S]+?})\s*```\s*$/;
const match = raw.match(fencedJsonRegex);
const markdownContent = raw.substring(0, raw.lastIndexOf(match[0])).trim();

agentResponse = {
  markdown: markdownContent,
  next_steps: parsedJson.next_steps || [],
  coach_insights: parsedJson.coach_insights,
  suggested_questions: parsedJson.suggested_questions || [],
};
```

**New parsing (JSON-only):**
```typescript
// Entire response is JSON (no separate markdown)
const fencedJsonRegex = /```json\s*({[\s\S]+?})\s*```/;
const match = raw.match(fencedJsonRegex);

if (!match || !match[1]) {
  throw new Error('Agent did not return valid JSON format');
}

const parsedJson = JSON.parse(match[1]);

// The JSON contains all structured content
// No separate markdown field needed
agentResponse = {
  json: parsedJson,  // Full JSON object
  next_steps: parsedJson.next_steps || [],
  coach_insights: parsedJson.coach_insights,
  suggested_questions: parsedJson.suggested_questions || [],
  // For backward compatibility, you might generate markdown from JSON
  // or update your OutputPanel to render from JSON directly
};
```

### Step 4: Update OutputPanel.tsx Rendering

**Current:** Renders markdown string directly
**New:** Render from JSON structure

You'll need to create React components to render:
- Meeting title & purpose
- Workstream notes (with emphasis)
- Next steps table
- Critical review (if present)
- Coach insights (if present)

**Example rendering function for text with emphasis:**
```typescript
function renderTextWithEmphasis(
  text: string,
  emphasis: Array<{start: number, end: number, type: string, value: string}>
) {
  if (!emphasis || emphasis.length === 0) {
    return <span>{text}</span>;
  }

  // Sort emphasis by start position
  const sorted = [...emphasis].sort((a, b) => a.start - b.start);

  const parts = [];
  let lastIndex = 0;

  sorted.forEach(({start, end, type, value}) => {
    // Add text before emphasis
    if (start > lastIndex) {
      parts.push(<span key={lastIndex}>{text.substring(lastIndex, start)}</span>);
    }

    // Add emphasized text with styling based on type
    const className = getEmphasisClassName(type); // Your custom styling
    parts.push(
      <span key={start} className={className}>
        {text.substring(start, end)}
      </span>
    );

    lastIndex = end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

function getEmphasisClassName(type: string): string {
  const typeStyles = {
    person: 'font-semibold text-blue-600 dark:text-blue-400',
    date: 'font-semibold text-red-600 dark:text-red-400',
    status: 'font-semibold text-green-600 dark:text-green-400',
    task: 'font-semibold text-purple-600 dark:text-purple-400',
    department: 'font-semibold text-indigo-600 dark:text-indigo-400',
    monetary: 'font-semibold text-yellow-600 dark:text-yellow-400',
    deadline: 'font-semibold text-orange-600 dark:text-orange-400',
    risk: 'font-semibold text-red-700 dark:text-red-500',
    general: 'font-semibold',
  };
  return typeStyles[type] || 'font-semibold';
}
```

### Step 5: Test Both Agents

**Test Script Update:**
Update [test-agent-runner.js](test-agent-runner.js) to test both agents:

```javascript
const NOTES_AGENT_ID = 'your-notes-agent-id';
const INTERROGATION_AGENT_ID = 'your-interrogation-agent-id';

// Test 1: Meeting Notes Agent
const notesResult = await testNotesAgent(accessToken, NOTES_AGENT_ID);

// Test 2: Interrogation Agent
const interrogationResult = await testInterrogationAgent(accessToken, INTERROGATION_AGENT_ID);
```

Run tests:
```bash
node test-agent-runner.js
```

Validate:
1. Notes agent returns JSON-only (no markdown)
2. All emphasis markers have valid positions
3. Emphasis type values are valid
4. All required JSON keys present
5. Interrogation agent complies with strict fence protocol
6. Both agents respect output_language

### Step 6: Update UI Components (Gradual Migration)

**Option A: Big Bang (Rewrite all at once)**
- Create new JSON-based rendering components
- Switch over in one deployment
- Higher risk but faster

**Option B: Gradual Migration (Recommended)**
1. Keep current markdown rendering as fallback
2. Add JSON rendering alongside
3. Feature flag to switch between modes
4. Test JSON mode with subset of users
5. Gradually roll out to 100%
6. Remove markdown rendering after validation

**Recommended approach:**
```typescript
function OutputPanel({ response }) {
  const useJsonMode = localStorage.getItem('useJsonMode') === 'true';

  if (useJsonMode && response.json) {
    return <JsonBasedOutput data={response.json} />;
  } else {
    return <MarkdownBasedOutput markdown={response.markdown} />;
  }
}
```

---

## Testing Checklist

### Meeting Notes Agent
- [ ] Returns valid JSON-only (no markdown outside fence)
- [ ] All required keys present (meeting_title, meeting_purpose, workstream_notes, next_steps, suggested_questions)
- [ ] Emphasis markers accurate (value matches text substring)
- [ ] Emphasis types valid (person|date|status|task|department|monetary|deadline|risk|general)
- [ ] RAG status logic correct (RED/AMBER/GREEN/NA)
- [ ] Conditional output works (view="actions-only", critical_lens, meeting_coach)
- [ ] focus_department filters correctly
- [ ] status_view="separate" adds current_status array
- [ ] Output language respected (text in target language, keys/codes in English)
- [ ] Coach insights include emphasis markers
- [ ] Suggested questions are context-specific

### Interrogation Agent
- [ ] Returns valid JSON-only with strict fence protocol
- [ ] No text before/after JSON fence
- [ ] not_in_transcript flag accurate
- [ ] Follow-up suggestions context-specific (1-2 items)
- [ ] Output language respected
- [ ] Edge cases handled (unclear question, not found, etc.)

### Integration
- [ ] Both agents accessible via separate IDs
- [ ] Settings UI allows configuring both agent IDs
- [ ] generateNotes uses notesAgentId
- [ ] interrogateTranscript uses interrogationAgentId
- [ ] Response parsing updated for JSON-only
- [ ] UI renders JSON structure correctly
- [ ] Emphasis styling applied consistently
- [ ] No regression in functionality

---

## Rollback Plan

If issues arise after deployment:

### Option 1: Revert to Single Agent
1. Update .env.local to use old bot ID for both
2. Temporarily use old system prompt
3. Fix issues offline
4. Redeploy when ready

### Option 2: Fallback Rendering
1. Keep markdown rendering as fallback
2. Switch to markdown mode if JSON parsing fails
3. Investigate and fix JSON issues
4. Re-enable JSON mode when stable

### Option 3: Agent-Level Rollback
1. Keep old agent active
2. Switch agent IDs in settings back to old agent
3. Fix new agents offline
4. Switch back when ready

---

## Performance Considerations

### Prompt Size Comparison

**Old (Single Agent):**
- ~800 lines total
- Both modes in one prompt
- Larger context per request

**New (Two Agents):**
- Notes Agent: ~550 lines
- Interrogation Agent: ~350 lines
- Smaller context per request
- Faster response times

### Expected Performance Improvements

1. **Faster Interrogation:**
   - Smaller prompt (350 vs 800 lines)
   - ~40% reduction in context size
   - Estimated 20-30% faster response

2. **More Reliable Parsing:**
   - JSON-only format (no markdown ambiguity)
   - Strict fence protocol (interrogation)
   - Fewer parsing errors

3. **Better Token Efficiency:**
   - No need to generate markdown formatting
   - Direct JSON generation
   - Lower costs per request

---

## Future Enhancements

With the new JSON-only + semantic emphasis format, you can now build:

1. **Semantic Search**
   - "Find all mentions of Casey"
   - "Show all HIGH risks"
   - "List all deadlines"

2. **Filtered Views**
   - Department-specific dashboards
   - Risk-only view
   - Action items by person

3. **Custom Themes**
   - Different color schemes for emphasis types
   - User-configurable styling
   - Dark/light mode optimizations

4. **Advanced Analytics**
   - Track most mentioned people
   - Count risk levels across meetings
   - Deadline distribution charts

5. **Export Formats**
   - PDF with custom styling
   - DOCX with emphasis preserved
   - CSV of action items
   - Calendar integration (due dates)

6. **AI-Powered Features**
   - Auto-assign departments using ML
   - Predict task risk levels
   - Suggest follow-up questions using meeting history

---

## Support & Maintenance

### Documentation Files
- `SYSTEM-PROMPT-MEETING-NOTES-AGENT.md` - Full prompt for notes agent
- `SYSTEM-PROMPT-INTERROGATION-AGENT.md` - Full prompt for Q&A agent
- `SYSTEM-PROMPTS-IMPLEMENTATION-GUIDE.md` - This file
- `AGENT-TEST-ANALYSIS.md` - Original analysis and proposal
- `TEST-SUMMARY-AND-RECOMMENDATIONS.md` - Quick summary
- `test-agent-runner.js` - Test script

### Testing
Run anytime to validate both agents:
```bash
node test-agent-runner.js
```

### Questions or Issues
Refer to detailed sections in the system prompt files or the original analysis documents.

---

## Summary

✅ **Two specialized agents** replace one complex agent
✅ **JSON-only format** with semantic emphasis tracking
✅ **Future-proof** architecture enabling advanced features
✅ **Better performance** (smaller prompts, faster responses)
✅ **Easier maintenance** (clear separation, independent testing)

**Next Steps:**
1. Create two agents in your platform
2. Copy system prompts to agents
3. Update apiService.ts with two agent IDs
4. Test both agents with test script
5. Update UI rendering for JSON format
6. Deploy and monitor

Good luck with implementation! 🚀
