# Feature Specification: Quick Summary & Enhanced UX

**Created:** 2025-10-28
**Status:** In Implementation
**Priority:** High

---

## 📋 Overview

This document specifies the implementation of quick summary features and collapsible sections for the meeting notes output panel.

## 🎯 Core Requirements

### **User Need**
Users need to quickly grasp meeting content at-a-glance without reading everything. Two complementary solutions:

1. **Executive Summary** - Concise bullet points of key takeaways
2. **Focus Mode** - Visual highlighting of emphasized content for scanning
3. **Collapsible Sections** - Allow users to hide/show workstreams

---

## 🚀 Implementation Plan (Hybrid Approach)

### **Phase 1: Collapsible Workstream Sections** ✅ NEXT
**Priority:** Immediate (no agent changes required)
**Time Estimate:** 30 minutes

#### Behavior Specification
- **Default state:** All workstream sections expanded
- **Hover state:**
  - Chevron icon fades in on left of title (animated, 0.2s)
  - Title area shows subtle hover background
  - Cursor changes to pointer
- **Click behavior:**
  - Toggle collapse/expand with smooth accordion animation (0.3s ease-in-out)
  - Chevron rotates: right (collapsed) → down (expanded)
- **Persistence:** Save collapse state per workstream in sessionStorage
- **Reset:** Expand all on page refresh

#### Visual Design
```
Light Mode:
- Chevron default: opacity-0 (invisible)
- Chevron hover: slate-400, opacity-100
- Hover bg: slate-50
- Transition: 200ms ease

Dark Mode:
- Chevron default: opacity-0 (invisible)
- Chevron hover: slate-600, opacity-100
- Hover bg: slate-800/50
- Transition: 200ms ease
```

#### Code Location
**File:** `components/StructuredNotesView.tsx`
**Component:** `WorkstreamSection`

#### Implementation Details
```tsx
const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
  // Load from sessionStorage
  const stored = sessionStorage.getItem('expandedWorkstreams');
  return stored ? JSON.parse(stored) : {};
});

const toggleSection = (name: string) => {
  setExpandedSections(prev => {
    const updated = { ...prev, [name]: !prev[name] };
    sessionStorage.setItem('expandedWorkstreams', JSON.stringify(updated));
    return updated;
  });
};

// Default to expanded if not in state
const isExpanded = expandedSections[workstream.name] !== false;
```

---

### **Phase 2: Executive Summary** 🎯 PRIMARY FEATURE
**Priority:** High
**Time Estimate:** 60 minutes

#### Feature Specification

**Data Source:** Agent generates new field in JSON response
```json
{
  "executive_summary": [
    "3 key decisions made on vendor selection",
    "Luis addressing 4 critical bugs this week",
    "Filter feature requested for blackout freelancer management"
  ]
}
```

**UI Component:** `SummaryCard`
- **Position:** Below title/purpose section, above workstreams
- **Default state:** Collapsed (hidden)
- **Toggle:** Button to expand/collapse
- **Visual style:** Gold/amber accent to signal importance

#### Visual Design

**Collapsed State:**
```
┌─────────────────────────────────────────────────┐
│  [⚡️ Executive Summary]                    [▼]  │
└─────────────────────────────────────────────────┘
```

**Expanded State:**
```
┌─────────────────────────────────────────────────┐
│  [⚡️ Executive Summary]                    [▲]  │
├─────────────────────────────────────────────────┤
│  • 3 key decisions made on vendor selection     │
│  • Luis addressing 4 critical bugs this week    │
│  • Filter feature requested for blackout mgmt   │
└─────────────────────────────────────────────────┘
```

**Styling:**
```css
Light Mode:
- Background: amber-50/30
- Border: amber-200/50
- Border-left: 3px solid amber-500
- Icon color: amber-600
- Text: slate-800

Dark Mode:
- Background: amber-900/10
- Border: amber-800/30
- Border-left: 3px solid amber-600
- Icon color: amber-500
- Text: slate-200
```

#### Typography
- Title: 16px, font-semibold, amber-800 (light) / amber-200 (dark)
- Bullets: 15px, font-normal, slate-700 (light) / slate-300 (dark)
- Line height: 1.7
- Spacing: 8px between bullets

#### Agent System Prompt Addition

**File to Update:** `SYSTEM-PROMPT-MEETING-NOTES-AGENT.md`

**New Section (insert after line 298, before next_steps):**
```markdown
"executive_summary": [       // NEW: Brief overview for quick scanning
  "string",                  // 3-5 bullet points, each ≤100 characters
  "string",                  // Plain text, no markdown
  "string"                   // Focus: key decisions, major actions, critical risks
]
```

**Detailed Instructions (add to CONTENT EXTRACTION section):**
```markdown
EXECUTIVE SUMMARY (GENERATE FOR ALL MEETINGS):

After extracting all content, synthesize 3-5 high-level bullet points that capture:
1. Key decisions made (with owner if applicable)
2. Major action items or deliverables (with owner if applicable)
3. Critical risks or blockers identified
4. Significant changes in scope, timeline, or approach

RULES:
• Each bullet ≤100 characters (strict limit)
• Plain text only (no markdown, no emojis)
• Each bullet must be self-contained (no pronouns referring to previous bullets)
• Order by importance: most critical/impactful first
• Include names and dates when they add clarity
• Avoid vague language: prefer concrete nouns and specific actions
• If meeting has <3 notable items, generate 3 bullets anyway (expand to cover all workstreams)

EXAMPLES:

Good:
• "Approved $50K vendor budget (Bob Smith, Oct 15)"
• "4 critical PDF bugs assigned to Luis for this week"
• "New filter feature requested for blackout management"

Bad (too long):
• "The team discussed several budget options and ultimately decided to approve a $50,000 budget allocation for vendor onboarding, pending final approval from Bob Smith by October 15th"

Bad (vague):
• "Several decisions were made"
• "Some bugs need fixing"
• "A new feature was discussed"

Bad (pronouns):
• "He will fix the bugs"
• "They approved the budget"

Generate in output_language.
```

#### TypeScript Types

**File:** `types.ts`

```typescript
export interface AgentResponse {
  markdown: string;
  next_steps: NextStep[];
  coach_insights?: CoachInsights;
  suggested_questions?: string[];
  structured_data?: StructuredNoteData;
  executive_summary?: string[];  // NEW: 3-5 concise bullet points
}
```

#### Implementation Files

**New Component:** `components/SummaryCard.tsx`
```tsx
interface SummaryCardProps {
  bullets: string[];
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ bullets, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`rounded-lg border-l-4 border-amber-500 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-600 dark:text-amber-500">⚡️</span>
          <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200">
            Executive Summary
          </h3>
        </div>
        <Icon
          name={isExpanded ? "chevron-up" : "chevron-down"}
          className="h-5 w-5 text-amber-600 dark:text-amber-500"
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2">
          <ul className="space-y-2">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="text-amber-500 dark:text-amber-400 mt-0.5">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

**Update:** `components/StructuredNotesView.tsx`
- Import SummaryCard
- Add after title/purpose section, before workstreams
- Check if executive_summary exists and has items

**Update:** `services/apiService.ts`
- Parse executive_summary from agent response
- Add to AgentResponse object
- Handle both old format (without summary) and new format (with summary)

---

### **Phase 3: Focus Mode** 🎨 VISUAL ENHANCEMENT
**Priority:** Medium (after Phase 1 & 2)
**Time Estimate:** 45 minutes

#### Feature Specification

**UI Element:** Toggle button in top-right of output panel
```
Position: Near export buttons
Label: "👁️ Focus Mode" or "🔍 Scan Mode"
Toggle state: ON/OFF
```

**Behavior:**
- **Default:** OFF (normal view)
- **When ON:**
  - Dim all non-emphasized text to 30% opacity
  - Keep emphasized text at 100% opacity
  - Add subtle glow/highlight to emphasized spans
  - Smooth transition (0.3s ease-in-out)
- **Keyboard shortcut:** F key (Focus)
- **State persistence:** sessionStorage

#### Visual Implementation

**CSS Classes:**
```css
/* Focus Mode Active */
.focus-mode {
  /* Non-emphasized text */
  .text-content:not(.emphasis-span) {
    opacity: 0.3;
    transition: opacity 0.3s ease-in-out;
  }

  /* Emphasized text */
  .emphasis-span {
    opacity: 1;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.3); /* subtle glow */
    transition: all 0.3s ease-in-out;
  }
}
```

**React State:**
```tsx
const [focusModeActive, setFocusModeActive] = useState(() => {
  return sessionStorage.getItem('focusMode') === 'true';
});

const toggleFocusMode = () => {
  setFocusModeActive(prev => {
    const newValue = !prev;
    sessionStorage.setItem('focusMode', String(newValue));
    return newValue;
  });
};

// Keyboard shortcut
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
      const activeEl = document.activeElement;
      if (activeEl?.tagName !== 'INPUT' && activeEl?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleFocusMode();
      }
    }
  };
  document.addEventListener('keydown', handleKeyPress);
  return () => document.removeEventListener('keydown', handleKeyPress);
}, []);
```

#### Enhanced Emphasis Requirements

**Current State:** Agent emphasizes sparingly (only critical items)

**Proposed Enhancement:** Mark 15-20% of content with emphasis
- All person names (every occurrence)
- All dates and deadlines
- All status keywords (blocked, approved, pending, etc.)
- All task names and deliverables
- All numbers and metrics
- All department names
- All monetary values

**System Prompt Update:**
```markdown
EMPHASIS TRACKING RULES (UPDATED):

Mark emphasis generously to support "Focus Mode" scanning:
• Mark ALL person names (every occurrence, not just first)
• Mark ALL dates, times, and deadlines
• Mark ALL status keywords
• Mark ALL task names and deliverables
• Mark ALL numbers, percentages, and metrics
• Mark ALL monetary values
• Mark ALL department names when contextually relevant
• Mark ALL risk indicators

TARGET: 15-20% of text should have emphasis markers
This supports "scan mode" where users read only emphasized words.

Avoid over-marking:
• Do NOT mark articles (a, an, the)
• Do NOT mark prepositions unless part of task name
• Do NOT mark generic verbs (is, has, will) unless in status phrase
```

**Note:** This requires agent retraining/redeployment after Phase 2 is complete.

---

## 📊 Testing Checklist

### Phase 1: Collapsible Sections
- [ ] Hover reveals chevron smoothly
- [ ] Click toggles collapse/expand
- [ ] Animation is smooth (0.3s)
- [ ] State persists in sessionStorage
- [ ] State resets to expanded on refresh
- [ ] Works in light and dark mode
- [ ] Chevron rotation is smooth

### Phase 2: Executive Summary
- [ ] Summary appears below title/purpose
- [ ] Summary is collapsed by default
- [ ] Click expands/collapses smoothly
- [ ] Gold/amber accent is visible and professional
- [ ] Bullets are properly formatted
- [ ] Works when summary is missing (graceful degradation)
- [ ] Works in light and dark mode
- [ ] Exports correctly in PDF/email

### Phase 3: Focus Mode
- [ ] Button toggles focus mode ON/OFF
- [ ] Non-emphasized text dims to 30%
- [ ] Emphasized text stays at 100%
- [ ] Transition is smooth (0.3s)
- [ ] Keyboard shortcut (F) works
- [ ] State persists in sessionStorage
- [ ] Doesn't interfere with text selection/copying
- [ ] Works in light and dark mode

---

## 🎨 Design Tokens

### Colors
```css
/* Executive Summary - Amber/Gold Accent */
--summary-bg-light: rgba(251, 191, 36, 0.1);    /* amber-50/30 */
--summary-bg-dark: rgba(251, 191, 36, 0.05);     /* amber-900/10 */
--summary-border-light: rgba(251, 191, 36, 0.3); /* amber-200/50 */
--summary-border-dark: rgba(217, 119, 6, 0.3);   /* amber-800/30 */
--summary-accent: #f59e0b;                       /* amber-500 */
--summary-text-light: #92400e;                   /* amber-800 */
--summary-text-dark: #fef3c7;                    /* amber-200 */

/* Collapsible Chevron */
--chevron-default: transparent;                  /* opacity-0 */
--chevron-hover-light: #94a3b8;                  /* slate-400 */
--chevron-hover-dark: #475569;                   /* slate-600 */
--hover-bg-light: #f8fafc;                       /* slate-50 */
--hover-bg-dark: rgba(30, 41, 59, 0.5);          /* slate-800/50 */

/* Focus Mode */
--focus-dim-opacity: 0.3;
--focus-glow: 0 0 8px rgba(59, 130, 246, 0.3);
```

### Animations
```css
/* Collapse/Expand */
transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;

/* Chevron Fade */
transition: opacity 0.2s ease;

/* Focus Mode Fade */
transition: opacity 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
```

---

## 🔄 Backward Compatibility

**Executive Summary:**
- If `executive_summary` field is missing → Component doesn't render (graceful degradation)
- Old agent responses continue to work without summary

**Collapsible Sections:**
- No agent changes required
- Works with all existing data

**Focus Mode:**
- Works with existing emphasis data
- Degrades gracefully if emphasis is sparse (just shows what's there)

---

## 📝 Notes & Decisions

**Decision Log:**

1. **Why Executive Summary over Focus Mode first?**
   - More direct solution to core need (quick overview)
   - Professional and exportable
   - Focus Mode requires comprehensive emphasis (agent enhancement)

2. **Why hover-revealed chevron?**
   - Cleanest visually (no clutter)
   - Modern pattern (Notion, Linear)
   - Discoverable through hover affordance

3. **Why collapsed by default for summary?**
   - Keeps UI clean for users who want full detail
   - "Pull" model vs "push" model (user opts in)
   - Executive summary is for specific use case (quick scan)

4. **Why gold/amber accent?**
   - Signals importance (warmer than blue)
   - Differentiates from other UI elements
   - Professional (not garish)
   - Good contrast in light/dark modes

5. **Why sessionStorage vs localStorage?**
   - Collapse state is ephemeral (per session)
   - Fresh state on new browser session feels cleaner
   - Avoids stale state bugs

---

## 🚀 Implementation Order (Confirmed)

1. ✅ Document everything (this file)
2. ⏭️ **Collapsible Sections** (30 min)
3. ⏭️ **Executive Summary** (60 min)
   - Update system prompt
   - Create SummaryCard component
   - Update types and apiService
   - Test with new agent responses
4. ⏭️ **Focus Mode** (45 min)
   - Add toggle button
   - Implement dimming logic
   - Add keyboard shortcut
   - Test scanning experience

**Total Estimated Time:** ~2.5 hours

---

## 📚 Related Documentation

- [SYSTEM-PROMPT-MEETING-NOTES-AGENT.md](../SYSTEM-PROMPT-MEETING-NOTES-AGENT.md) - Agent system prompt
- [types.ts](../types.ts) - TypeScript type definitions
- [StructuredNotesView.tsx](../components/StructuredNotesView.tsx) - Main notes view component
- [OutputPanel.tsx](../components/OutputPanel.tsx) - Output panel wrapper

---

**Last Updated:** 2025-10-28
**Next Review:** After Phase 2 completion
