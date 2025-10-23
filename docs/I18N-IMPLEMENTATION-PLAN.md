# Internationalization (i18n) Implementation Plan

## Document Information
- **Version**: 1.0
- **Date**: 2025-10-23
- **Status**: Planning Phase - Approved for Implementation
- **Owner**: IPCT Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Momentum Office Locations & Language Requirements](#momentum-office-locations--language-requirements)
3. [Technology Stack](#technology-stack)
4. [Architecture Overview](#architecture-overview)
5. [Agent System Prompt Modifications](#agent-system-prompt-modifications)
6. [Implementation Phases](#implementation-phases)
7. [Translation Files Structure](#translation-files-structure)
8. [Language Detection & Storage](#language-detection--storage)
9. [Japanese-Specific Considerations](#japanese-specific-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Rollout Plan](#rollout-plan)
12. [Risks & Mitigations](#risks--mitigations)
13. [Success Metrics](#success-metrics)

---

## Executive Summary

This document outlines the complete implementation plan for adding multi-language support to the Meeting Notes Generator application to serve Momentum's global offices.

### Target Languages
- **English (en)** - US, GB, CA offices (ATL, CHI, NYC, STL, LDN, TOR)
- **Spanish (es)** - Spain office (MAD)
- **Japanese (ja)** - Japan office (TYO)

### Key Findings from Testing
- ✅ Current agent responds in English even when given Japanese transcript
- ✅ System prompt requires explicit output language instruction
- ✅ UI currently has no i18n infrastructure
- ✅ Theme preference pattern can be replicated for language preference

### Implementation Timeline
- **Phase 1-2**: Foundation & UI Components (2 weeks)
- **Phase 3-4**: Agent Integration & Translations (2 weeks)
- **Phase 5**: Testing & UAT (1 week)
- **Phase 6**: Rollout (1 week)
- **Total**: 6 weeks from start to production

---

## Momentum Office Locations & Language Requirements

### Office Distribution

| Office Code | City | Country | Primary Language | Users (Estimated) |
|-------------|------|---------|------------------|-------------------|
| ATL-MOM | Atlanta | US | English (en) | ~40 |
| CHI-MOM | Chicago | US | English (en) | ~60 |
| NYC-MOM | New York | US | English (en) | ~100 |
| STL-MOM | St. Louis | US | English (en) | ~30 |
| LDN-MOM | London | GB | English (en) | ~50 |
| TOR-MOM | Toronto | CA | English (en)* | ~35 |
| MAD-MOM | Madrid | ES | Spanish (es) | ~45 |
| TYO-MOM | Tokyo | JP | Japanese (ja) | ~25 |

**Total Users**: ~385
**Language Distribution**: 77% English, 12% Spanish, 11% Japanese

*Note: TOR-MOM may require French-Canadian (fr-CA) in future phases.

### Language-Region Mapping

```typescript
const OFFICE_TO_LANGUAGE: Record<string, string> = {
  'ATL-MOM': 'en',
  'CHI-MOM': 'en',
  'NYC-MOM': 'en',
  'STL-MOM': 'en',
  'LDN-MOM': 'en',
  'TOR-MOM': 'en',
  'MAD-MOM': 'es',
  'TYO-MOM': 'ja'
};

const TIMEZONE_TO_LANGUAGE: Record<string, string> = {
  'America/New_York': 'en',
  'America/Chicago': 'en',
  'America/Los_Angeles': 'en',
  'America/Toronto': 'en',
  'Europe/London': 'en',
  'Europe/Madrid': 'es',
  'Asia/Tokyo': 'ja'
};
```

---

## Technology Stack

### Core i18n Library: **react-i18next v14**

**Dependencies to install:**
```json
{
  "dependencies": {
    "i18next": "^23.15.0",
    "react-i18next": "^14.1.0",
    "i18next-browser-languagedetector": "^8.0.0"
  },
  "devDependencies": {
    "@types/i18next": "^13.0.0"
  }
}
```

**Why react-i18next:**
- ✅ Industry standard (8M+ weekly downloads)
- ✅ Excellent TypeScript support
- ✅ Runtime language switching
- ✅ Small bundle size (~15kb gzipped)
- ✅ Works perfectly with Vite + React
- ✅ Namespace support for organized translations
- ✅ Built-in pluralization and interpolation

---

## Architecture Overview

### File Structure (New Files)

```
Momo Meetings App/
├── locales/                          # Translation files
│   ├── en/
│   │   ├── common.json              # Common UI strings
│   │   ├── forms.json               # Form labels/placeholders
│   │   ├── settings.json            # Settings panel
│   │   ├── constants.json           # Dropdown options, presets
│   │   ├── help.json                # Help modal content
│   │   ├── tour.json                # Onboarding tour
│   │   └── validation.json          # Error messages
│   ├── es/
│   │   ├── common.json
│   │   ├── forms.json
│   │   ├── settings.json
│   │   ├── constants.json
│   │   ├── help.json
│   │   ├── tour.json
│   │   └── validation.json
│   └── ja/
│       ├── common.json
│       ├── forms.json
│       ├── settings.json
│       ├── constants.json
│       ├── help.json
│       ├── tour.json
│       └── validation.json
│
├── utils/
│   └── i18n.ts                      # i18next configuration
│
├── hooks/
│   └── useLanguage.ts               # Language switching hook
│
├── components/
│   └── LanguageSelector.tsx         # Flag dropdown component
│
└── docs/
    ├── I18N-IMPLEMENTATION-PLAN.md  # This document
    ├── AGENT-SYSTEM-PROMPT.md       # Documented system prompt
    └── AGENT-SYSTEM-PROMPT-UPDATED.md  # Modified prompt with language support
```

---

## Agent System Prompt Modifications

### Current Prompt Analysis

**File**: Internal agent configuration (not in codebase)

**Current behavior:**
- ❌ Always outputs in English regardless of input language
- ❌ No language detection or control flag
- ❌ No instruction for multi-language output

### Required Modifications

#### 1. Add Language Control Flag

**Location**: `INPUTS (FROM UI / APP)` section (after line ~205)

**Add:**
```
• output_language .......... "en" | "es" | "ja" (default: "en")
  Specifies the language for ALL generated content (minutes, insights, coach, questions).
```

#### 2. Add Output Language Rule

**Location**: `CORE RULES` section (after "Use ONLY the user-provided content" paragraph, line ~237)

**Add new section:**

```
================================================================
OUTPUT LANGUAGE RULE (APPLIES TO ALL GENERATED CONTENT)

When output_language is set, ALL generated text must be in that language.

SCOPE OF TRANSLATION:
• Meeting Title (if generated) — translate to output_language
• Meeting Purpose — translate to output_language
• Section headings — translate to output_language
• Workstream names — keep as provided in Agenda; if extrapolated, translate
• All bullets (Key Discussion Points, Decisions Made, Risks) — translate
• Action Item descriptions (Task column) — translate
• Status Notes — translate
• Critical Review content — translate
• Meeting Coach insights (all strings in coach_insights JSON) — translate
• Suggested Questions — translate

EXCEPTIONS (KEEP IN ENGLISH):
• JSON keys in machine-readable block — always English
  (e.g., "next_steps", "coach_insights", "question", "answer")
• Department codes — always English codes
  (BL, STR, PM, CR, XD, XP, IPCT, CON, STU, General)
• Status codes in JSON — always English
  ("RED", "AMBER", "GREEN", "NA")
• Boolean/enum values in JSON — always English
  (true, false, "gentle", "direct", etc.)

LANGUAGE-SPECIFIC GUIDELINES:

Spanish (es):
• Use business Spanish (Spain variant for Madrid office)
• Formal "usted" form when addressing users in coach insights
• Professional tone; avoid colloquialisms
• Preserve markdown formatting exactly as English

Japanese (ja):
• Use polite business Japanese (敬語 keigo style)
• Use です/ます form (desu/masu) for professional tone
• Avoid casual forms (だ/である)
• Preserve markdown formatting exactly as English
• Keep proper nouns (company names, project codenames) in original language
  unless they appear translated in the transcript

MIXED-LANGUAGE SCENARIOS:
• If transcript is in English but output_language=es, translate all generated
  content to Spanish while preserving quoted speaker statements in original language.
• If transcript contains mixed languages, output in output_language only.
• Person names, project codenames, technical terms: keep in original form from transcript.

QUALITY CHECK (before responding):
• Verify ALL section headings are in output_language
• Verify ALL generated sentences/bullets are in output_language
• Verify JSON keys remain in English
• Verify department codes remain as English abbreviations
```

#### 3. Update Console Mode Preset Defaults

**Location**: `Console Preset Defaults` section (line ~362)

**Update the line to:**
```
audience="cross-functional"; tone="professional"; view="full"; critical_lens=true;
redact=false; use_icons=true; bold_important_words=true; meeting_coach=true;
coaching_style="gentle"; status_view="embedded"; generate_suggested_questions=true;
suggested_questions_count=3; output_language="en"; do not set focus_department by default.
```

#### 4. Update App Mode Detection

**No changes needed** — the app will pass `output_language` as a control flag just like other controls.

### Language Flag Usage in App

**File**: `services/apiService.ts` → `constructPrompt()` function

**Current code** (approximate line 60-95):
```typescript
const constructPrompt = (payload: Payload): string => {
    const { meeting_title, agenda, transcript, controls } = payload;

    const promptParts = [
        `<<<APP_MODE>>>`,
        `Meeting Title: ${meeting_title}`,
        // ...
    ];

    return promptParts.join('\n');
};
```

**Updated code** (to add language):
```typescript
import i18n from '../utils/i18n';

const constructPrompt = (payload: Payload): string => {
    const { meeting_title, agenda, transcript, controls } = payload;

    // Get current app language
    const currentLanguage = i18n.language || 'en'; // 'en', 'es', or 'ja'

    const promptParts = [
        `<<<APP_MODE>>>`,
        `Meeting Title: ${meeting_title}`,
        `Agenda:`,
        agenda,
        `Transcript:`,
        transcript,
        `Controls:`,
        `focus_department: ${controls.focus_department}`,
        `view: ${controls.view}`,
        // ... all other controls ...
        `output_language: ${currentLanguage}`,  // ADD THIS LINE
    ];

    return promptParts.join('\n');
};
```

### Validation Test Cases

After implementing the prompt changes, test:

1. **English input → English output** (default behavior)
   - Input: English transcript, `output_language: en`
   - Expected: All content in English

2. **English input → Spanish output**
   - Input: English transcript, `output_language: es`
   - Expected: All generated content in Spanish, quotes preserved in English

3. **English input → Japanese output**
   - Input: English transcript, `output_language: ja`
   - Expected: All generated content in Japanese, quotes preserved in English

4. **Japanese input → Japanese output**
   - Input: Japanese transcript, `output_language: ja`
   - Expected: All content in Japanese

5. **Mixed input → Spanish output**
   - Input: Mixed English/Spanish transcript, `output_language: es`
   - Expected: All generated content in Spanish

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

#### Tasks

1. **Install Dependencies**
   ```bash
   npm install i18next react-i18next i18next-browser-languagedetector
   npm install --save-dev @types/i18next
   ```

2. **Create i18n Configuration**
   - File: `utils/i18n.ts`
   - Configure language detection order
   - Set up fallback languages
   - Load translation namespaces

3. **Create Initial Translation Files**
   - Extract all English strings from codebase
   - Create `locales/en/*.json` files
   - Structure translation keys hierarchically

4. **Wrap App with I18nextProvider**
   - Update `index.tsx`
   - Initialize i18n before React render

5. **Create useLanguage Hook**
   - File: `hooks/useLanguage.ts`
   - Handle language switching
   - Sync with localStorage
   - Track via telemetry

**Deliverables:**
- ✅ i18n infrastructure working
- ✅ English translations loaded
- ✅ Language switching mechanism ready

---

### Phase 2: UI Components (Week 2)

#### Tasks

1. **Create LanguageSelector Component**
   - File: `components/LanguageSelector.tsx`
   - Flag-based dropdown (🇺🇸 🇪🇸 🇯🇵)
   - Store preference in localStorage
   - Emit telemetry event on change

2. **Add Language Selector to Header**
   - Update `components/Header.tsx`
   - Add to user menu dropdown
   - Position between "Toggle Theme" and "Replay Tutorial"

3. **Add Language Section to Settings**
   - Update `components/SettingsDrawer.tsx`
   - Add "Regional Settings" section
   - Include language selector + auto-detect toggle

4. **Update All UI Components**
   - Replace hardcoded strings with `t()` function
   - Files to update:
     - ✅ `components/Header.tsx`
     - ✅ `components/InputPanel.tsx`
     - ✅ `components/OutputPanel.tsx`
     - ✅ `components/SettingsDrawer.tsx`
     - ✅ `components/HelpModal.tsx`
     - ✅ `components/tour/*` (all tour files)
     - ✅ `components/ui/*` (all UI primitives)

**Deliverables:**
- ✅ Language selector UI working
- ✅ All UI text translatable
- ✅ Language preference persists

---

### Phase 3: AI Agent Integration (Week 3)

#### Tasks

1. **Update Agent System Prompt**
   - Add `output_language` control flag
   - Add OUTPUT LANGUAGE RULE section
   - Update Console Mode defaults
   - Document changes

2. **Update API Service**
   - Modify `services/apiService.ts`
   - Pass `output_language` in prompt
   - Get language from `i18n.language`

3. **Test Agent Output**
   - Test English → English
   - Test English → Spanish
   - Test English → Japanese
   - Test Japanese → Japanese
   - Verify JSON keys remain English

4. **Handle Edge Cases**
   - Mixed-language transcripts
   - Empty transcripts
   - Language switching mid-session

**Deliverables:**
- ✅ Agent responds in correct language
- ✅ JSON structure preserved
- ✅ All test cases passing

---

### Phase 4: Translations & Content (Week 4)

#### Tasks

1. **Generate Spanish Translations**
   - Use AI (GPT-4/Claude) for initial draft
   - Review with native speaker
   - Focus on business terminology
   - Spain Spanish variant

2. **Generate Japanese Translations**
   - Use AI for initial draft
   - Review with native speaker (Tokyo office)
   - Verify keigo (polite form) usage
   - Check character encoding

3. **Update Constants File**
   - Modify `constants.ts`
   - Change `label` to `labelKey`
   - Map to translation keys

4. **Create Help Content**
   - Translate help modal content
   - Translate tour steps
   - Translate error messages

5. **Japanese-Specific Fixes**
   - Add Japanese fonts to Tailwind config
   - Adjust line-height for Japanese
   - Test CSV export with Japanese characters
   - Add UTF-8 BOM if needed

**Deliverables:**
- ✅ Complete Spanish translation files
- ✅ Complete Japanese translation files
- ✅ All UI strings translated
- ✅ Japanese rendering correctly

---

### Phase 5: Testing (Week 5)

#### Tasks

1. **Unit Tests**
   - Language switching logic
   - Translation key resolution
   - Fallback behavior

2. **Integration Tests**
   - Full workflow in each language
   - Language persistence across sessions
   - Agent output language matching

3. **Visual Regression Tests**
   - Screenshots in 3 languages × 2 themes
   - Check for layout breaks
   - Verify text overflow handling

4. **UAT with Native Speakers**
   - Madrid office: 2-3 Spanish testers
   - Tokyo office: 2-3 Japanese testers
   - Collect feedback on translation quality
   - Identify UI/UX issues

5. **Cross-Browser Testing**
   - Chrome, Firefox, Edge, Safari
   - Windows + macOS
   - Japanese text rendering on Windows

**Deliverables:**
- ✅ All tests passing
- ✅ UAT feedback incorporated
- ✅ No critical bugs

---

### Phase 6: Rollout (Week 6)

#### Tasks

1. **Deploy to Staging**
   - Full feature enabled
   - Test with staging data
   - Verify telemetry flow

2. **Documentation**
   - User guide for language switching
   - Internal docs for maintenance
   - Update help modal

3. **Soft Launch**
   - Deploy to production
   - Default to English for all users
   - Send announcement email
   - Encourage testing

4. **Monitor & Support**
   - Watch telemetry adoption metrics
   - Monitor error rates
   - Respond to support tickets
   - Collect feedback

5. **Full Rollout**
   - Enable auto-detection
   - Announce to all users
   - Celebrate launch 🎉

**Deliverables:**
- ✅ Feature in production
- ✅ Users successfully using i18n
- ✅ Metrics tracking adoption

---

## Translation Files Structure

### Namespace Organization

**Strategy**: Separate translations by feature area for better organization and lazy-loading.

| Namespace | File | Content |
|-----------|------|---------|
| `common` | `common.json` | Header, buttons, navigation, generic terms |
| `forms` | `forms.json` | Form labels, placeholders, field descriptions |
| `settings` | `settings.json` | Settings panel, preferences, configuration |
| `constants` | `constants.json` | Dropdowns (audience, tone, departments), presets |
| `help` | `help.json` | Help modal content, documentation |
| `tour` | `tour.json` | Onboarding tour steps, welcome messages |
| `validation` | `validation.json` | Error messages, validation feedback |

### Translation Key Naming Convention

**Pattern**: `namespace:section.subsection.key`

**Examples:**
- `common:header.title` → "Meeting Notes Generator"
- `forms:input.title.label` → "Meeting Title"
- `constants:audience.executive` → "Executive (high-level)"
- `validation:errors.required` → "This field is required"

**Rules:**
- Use camelCase for multi-word keys
- Keep keys descriptive but concise
- Group related keys hierarchically
- Avoid deeply nested structures (max 3 levels)

### Translation File Schema

**See separate files:**
- `locales/en/*.json` (English - source of truth)
- `locales/es/*.json` (Spanish translations)
- `locales/ja/*.json` (Japanese translations)

---

## Language Detection & Storage

### Detection Priority Order

1. **User preference** (localStorage: `appLanguage`)
   - Set explicitly via language selector
   - Highest priority

2. **Browser language** (navigator.language)
   - Auto-detected on first visit
   - Map to supported languages (en/es/ja)

3. **Timezone-based fallback**
   - Use timezone to guess office location
   - Map to office's primary language

4. **Default fallback**
   - English (en)

### Storage Mechanism

**localStorage keys:**
```typescript
{
  "appLanguage": "en" | "es" | "ja",           // User's selected language
  "languageSource": "user" | "browser" | "timezone" | "default",
  "darkMode": true | false                      // Existing
  // ... other keys
}
```

**Implementation in `useLanguage` hook:**
```typescript
const getInitialLanguage = (): string => {
  // 1. Check user preference
  const saved = localStorage.getItem('appLanguage');
  if (saved && ['en', 'es', 'ja'].includes(saved)) {
    return saved;
  }

  // 2. Check browser language
  const browserLang = navigator.language.split('-')[0]; // 'en-US' → 'en'
  if (['en', 'es', 'ja'].includes(browserLang)) {
    return browserLang;
  }

  // 3. Check timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const langFromTimezone = TIMEZONE_TO_LANGUAGE[timezone];
  if (langFromTimezone) {
    return langFromTimezone;
  }

  // 4. Default fallback
  return 'en';
};
```

### Telemetry Tracking

**Add to all events:**
```typescript
{
  appLanguage: i18n.language,           // Current app language
  browserLanguage: navigator.language,  // Browser's preferred language
  languageSource: 'user' | 'browser' | 'timezone' | 'default'
}
```

**New event type:**
```typescript
'languageChanged': {
  from: string,        // Previous language
  to: string,          // New language
  method: 'manual' | 'auto-detected',
  timestamp: string
}
```

---

## Japanese-Specific Considerations

### Typography Requirements

#### Font Stack Update

**File**: `index.html` (Tailwind config, lines 10-61)

**Current:**
```javascript
fontFamily: {
  sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', ...]
}
```

**Updated:**
```javascript
fontFamily: {
  sans: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Noto Sans JP',      // Japanese
    'Hiragino Sans',     // macOS Japanese
    'Hiragino Kaku Gothic ProN',
    'Yu Gothic',         // Windows Japanese
    'Meiryo',
    'sans-serif'
  ]
}
```

**Load Google Fonts** (add to `<head>` in index.html):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
```

#### Line Height & Spacing

**Add to global CSS** (in `index.html` or new CSS file):
```css
html[lang="ja"] {
  line-height: 1.8;        /* vs 1.5 for en/es */
  letter-spacing: 0.02em;
}

html[lang="ja"] p,
html[lang="ja"] li {
  line-height: 1.8;
}

html[lang="ja"] h1,
html[lang="ja"] h2,
html[lang="ja"] h3 {
  line-height: 1.6;
  letter-spacing: 0.05em;
}
```

### Text Length Considerations

**Character count differences:**

| English | Spanish | Japanese | Ratio |
|---------|---------|----------|-------|
| "Generate Notes" (14) | "Generar Notas" (14) | "ノート生成" (5) | 1:1:0.35 |
| "Meeting Notes Generator" (23) | "Generador de Notas" (19) | "議事録ジェネレーター" (11) | 1:0.83:0.48 |
| "Toggle Theme" (12) | "Cambiar Tema" (13) | "テーマ切替" (5) | 1:1.08:0.42 |

**Impact:**
- Japanese text typically 40-60% shorter than English
- Buttons may look overly wide
- Use `min-width` or `w-auto` classes in Tailwind

**Fix strategy:**
```typescript
// Adjust button padding based on language
className={cn(
  "px-4 py-2",
  i18n.language === 'ja' && "px-6"  // Extra padding for Japanese
)}
```

### Date/Time Formatting

**Use `Intl.DateTimeFormat` for locale-aware formatting:**

```typescript
const formatDate = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Examples:
formatDate(new Date(), 'en-US');  // "October 23, 2025"
formatDate(new Date(), 'es-ES');  // "23 de octubre de 2025"
formatDate(new Date(), 'ja-JP');  // "2025年10月23日"
```

### CSV Export Encoding

**Issue**: Excel on Windows doesn't always handle UTF-8 correctly.

**Solution**: Add UTF-8 BOM (Byte Order Mark) for Japanese CSVs.

**File**: `utils/export.ts`

**Current** (approximate):
```typescript
const exportToCSV = (data: any[], filename: string) => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  // ... download logic
};
```

**Updated**:
```typescript
import i18n from './i18n';

const exportToCSV = (data: any[], filename: string) => {
  let csvContent = convertToCSV(data);

  // Add BOM for Japanese (helps Excel on Windows)
  if (i18n.language === 'ja') {
    csvContent = '\uFEFF' + csvContent;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  // ... download logic
};
```

### Form Validation

**Keep character limits the same** (count by characters, not bytes):
- Title: 100 characters (sufficient for Japanese)
- Agenda items: 200 characters each
- Transcript: unlimited

**Validation messages** must be translated:
```json
// ja/validation.json
{
  "errors": {
    "required": "この項目は必須です",
    "tooLong": "文字数が多すぎます（最大: {{max}}文字）",
    "tooShort": "文字数が少なすぎます（最小: {{min}}文字）"
  }
}
```

---

## Testing Strategy

### Unit Tests

**Framework**: Vitest (already in project) or Jest

**Test files to create:**
```
tests/
├── i18n.test.ts                 # i18n configuration
├── useLanguage.test.ts          # Language hook
├── LanguageSelector.test.tsx    # Language selector component
└── constants.test.ts            # Translation key mapping
```

**Test cases:**

1. **Language Detection**
   - ✅ Detects saved preference from localStorage
   - ✅ Falls back to browser language
   - ✅ Falls back to timezone-based language
   - ✅ Falls back to 'en' if none match

2. **Language Switching**
   - ✅ Changes app language when user selects
   - ✅ Persists to localStorage
   - ✅ Updates all UI text immediately
   - ✅ Emits telemetry event

3. **Translation Keys**
   - ✅ All keys have values in all languages
   - ✅ No missing translations
   - ✅ Fallback to English works
   - ✅ Interpolation works (e.g., {{count}} items)

4. **API Integration**
   - ✅ Passes correct `output_language` to agent
   - ✅ Handles agent response in different languages

### Integration Tests

**Framework**: Playwright or Cypress

**Test scenarios:**

1. **End-to-End Language Flow**
   ```typescript
   test('User can switch language and generate notes in Spanish', async () => {
     // 1. Load app (defaults to English)
     // 2. Open language selector
     // 3. Select Spanish
     // 4. Verify UI updates to Spanish
     // 5. Enter meeting data
     // 6. Generate notes
     // 7. Verify notes are in Spanish
     // 8. Refresh page
     // 9. Verify language persists
   });
   ```

2. **Language Persistence**
   - Set language → Refresh → Language remains
   - Set language → Clear cookies → Language remains (localStorage)
   - Set language → New tab → Language applies

3. **Mixed Content**
   - English UI + Japanese transcript → Japanese output
   - Spanish UI + English transcript → Spanish output

### Visual Regression Tests

**Tools**: Chromatic, Percy, or Playwright screenshots

**Test matrix**: 3 languages × 2 themes × 5 pages = 30 screenshots

| Page | Languages | Themes | Total |
|------|-----------|--------|-------|
| Login | en, es, ja | light, dark | 6 |
| Input Panel | en, es, ja | light, dark | 6 |
| Output Panel | en, es, ja | light, dark | 6 |
| Settings | en, es, ja | light, dark | 6 |
| Help Modal | en, es, ja | light, dark | 6 |

**Check for:**
- Text overflow
- Button width issues
- Table column alignment
- Modal sizing
- Tooltip positioning

### User Acceptance Testing (UAT)

**Participants needed:**
- **Madrid office**: 2-3 native Spanish speakers
- **Tokyo office**: 2-3 native Japanese speakers

**UAT Script:**

1. **Fresh browser** (incognito mode)
2. **Login** to application
3. **Check auto-detection**: Does language match your location?
4. **Switch language** via selector
5. **Review all UI text**: Any awkward translations?
6. **Generate meeting notes**:
   - English transcript → Your language output
   - Your language transcript → Your language output
7. **Test exports**: CSV, PDF in your language
8. **Review help content**: Is it clear and accurate?
9. **Try tour**: Is onboarding understandable?
10. **Provide feedback**: Rate translation quality (1-5)

**Feedback form** (Google Forms):
- Translation accuracy (1-5)
- UI clarity (1-5)
- Any confusing terms?
- Any layout issues?
- Suggestions for improvement

---

## Rollout Plan

### Timeline

| Week | Phase | Activities | Stakeholders |
|------|-------|------------|--------------|
| 1-2 | Development | Foundation + UI components | Dev team |
| 3-4 | Development | Agent integration + translations | Dev team + translators |
| 5 | Testing | Unit/integration tests + UAT | Dev team + MAD/TYO testers |
| 6 | Rollout | Staging → Production → Monitoring | Dev team + all users |

### Deployment Strategy

#### Stage 1: Internal Staging (Days 1-2)
- Deploy to staging environment
- Test with dev team
- Verify all features work
- Check telemetry flow

#### Stage 2: Beta Testing (Days 3-4)
- Invite 5-10 beta testers (2-3 per language)
- Provide feedback form
- Monitor for errors
- Collect translation feedback

#### Stage 3: Soft Launch (Day 5)
- Deploy to production
- **Default to English for all users** (conservative approach)
- Add banner: "New: Multi-language support! Switch in settings."
- Encourage opt-in testing

#### Stage 4: Full Rollout (Day 6-7)
- Enable auto-detection
- Send announcement email to all users
- Update help documentation
- Monitor adoption metrics

### Rollback Plan

**Triggers for rollback:**
- Critical bugs affecting >10% of users
- Agent consistently outputs wrong language
- Data loss or corruption
- Performance degradation >20%

**Rollback procedure:**
1. Revert to previous deployment (git tag)
2. Disable language selector via feature flag
3. Force all users to English
4. Investigate issue
5. Fix in staging
6. Re-deploy when stable

### Communication Plan

**Pre-Launch (1 week before):**
- Email to all users: "Coming soon: Multi-language support"
- Slack announcement in #general
- Demo video (30 seconds)

**Launch Day:**
- Email: "Now available: Use the app in Spanish and Japanese!"
- Include quick guide with screenshots
- Link to help documentation

**Post-Launch (1 week after):**
- Thank you email to beta testers
- Share adoption metrics (% using each language)
- Request feedback

---

## Risks & Mitigations

### High-Risk Issues

#### 1. AI Agent Language Mismatch
**Risk**: Agent continues outputting in English despite `output_language` flag.

**Impact**: Users see English notes when expecting Spanish/Japanese.

**Probability**: Medium (30%)

**Mitigation**:
- Test extensively with agent before rollout
- Add client-side validation: detect output language with simple heuristics
- Show warning banner: "Output may not be in your selected language"
- Fallback: Offer client-side translation via browser API (low quality, but better than nothing)

**Contingency**:
- If agent doesn't support language instruction, postpone rollout
- Work with backend team to update agent capabilities
- Consider alternative: client-side translation of agent output (not ideal)

#### 2. Japanese Text Rendering Issues
**Risk**: Japanese characters display as ���� or boxes on some systems.

**Impact**: Tokyo office users cannot read content.

**Probability**: Low-Medium (20%)

**Mitigation**:
- Load Japanese web fonts (Noto Sans JP)
- Test on Windows (most problematic OS)
- Add font fallbacks in CSS
- Test CSV export with UTF-8 BOM

**Contingency**:
- If web fonts fail, use system fonts only
- Provide troubleshooting guide for users
- Worst case: disable Japanese temporarily

#### 3. Translation Quality Issues
**Risk**: AI-generated translations are awkward or incorrect.

**Impact**: Users confused by poor translations; feature adoption low.

**Probability**: Medium (40%)

**Mitigation**:
- Have native speakers review all translations before launch
- Focus on critical UI elements (buttons, navigation, errors)
- Use professional translation service for help content
- Iterate based on user feedback

**Contingency**:
- Quick patch: update translation files (no code change needed)
- Set up translation improvement process
- Consider crowdsourcing corrections from users

### Medium-Risk Issues

#### 4. Layout Breaking
**Risk**: Longer translations (Spanish) break UI layout.

**Impact**: Buttons overflow, tables misaligned, modals too large.

**Probability**: Medium (30%)

**Mitigation**:
- Use flexible Tailwind layouts (flex, grid)
- Test with longest translations
- Set max-width on text containers
- Use ellipsis truncation where needed

**Contingency**:
- CSS hotfix for specific components
- Adjust padding/margins per language

#### 5. CSV Export Encoding
**Risk**: Japanese characters corrupted in Excel.

**Impact**: Tokyo users cannot export data properly.

**Probability**: Low-Medium (25%)

**Mitigation**:
- Add UTF-8 BOM for Japanese CSVs
- Test on Windows Excel specifically
- Provide instructions: "Open with UTF-8 encoding"

**Contingency**:
- Offer alternative export format (JSON, PDF)
- Create Excel-specific export with Shift-JIS encoding

#### 6. Performance Impact
**Risk**: Loading translations slows app startup.

**Impact**: User experience degraded; bounce rate increases.

**Probability**: Low (10%)

**Mitigation**:
- Lazy load translation files (only load active language)
- Minimize translation file size (tree-shake unused keys)
- Cache translations in localStorage

**Contingency**:
- Inline critical translations in bundle
- Use CDN for translation files

### Low-Risk Issues

#### 7. Browser Compatibility
**Risk**: i18next doesn't work in older browsers.

**Impact**: Some users cannot switch languages.

**Probability**: Low (5%)

**Mitigation**:
- i18next supports IE11+ (very broad compatibility)
- Test on target browsers (Chrome, Firefox, Edge, Safari)

**Contingency**:
- Show "Language switching requires modern browser" message
- Graceful degradation: default to English

#### 8. Telemetry Complexity
**Risk**: Multi-language telemetry data hard to analyze in Power BI.

**Impact**: Analytics less actionable.

**Probability**: Low (10%)

**Mitigation**:
- Keep event names in English
- Track `appLanguage` as separate dimension
- Document in Power BI integration guide

**Contingency**:
- Create language-specific Power BI reports
- Filter by language in dashboards

---

## Success Metrics

### Adoption Metrics

**Track via telemetry** (`utils/telemetryService.ts`)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Overall Adoption** | 20% of users switch language | % of sessions with non-English language |
| **Madrid Adoption** | 80% use Spanish | % of MAD-MOM users with `appLanguage=es` |
| **Tokyo Adoption** | 90% use Japanese | % of TYO-MOM users with `appLanguage=ja` |
| **Auto-Detection Accuracy** | 85% | % users who don't change auto-detected language |
| **Language Switching Rate** | <5% per session | % of sessions where language changed mid-session |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Translation Accuracy** | 95%+ | UAT feedback score (1-5 scale, average ≥4.5) |
| **AI Output Match** | 98%+ | % of agent outputs in correct language |
| **Layout Issues** | <5% | Visual regression test failure rate |
| **Export Encoding Issues** | 0 | Bug reports related to character encoding |
| **User Satisfaction** | 90%+ | Post-launch survey: "Satisfied with language support" |

### Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Initial Load Time** | <50ms increase | Lighthouse CI: time to interactive |
| **Bundle Size Increase** | <50kb | Webpack bundle analyzer |
| **Language Switch Time** | <100ms | React DevTools Profiler |
| **Memory Usage** | <5MB increase | Chrome DevTools Memory |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Madrid Engagement** | +15% session duration | Google Analytics |
| **Tokyo Engagement** | +15% session duration | Google Analytics |
| **Feature Usage** | No decrease | Compare notes generated before/after |
| **Error Rate** | No increase | Sentry error tracking |
| **Support Tickets** | <10 related to i18n | JIRA/ServiceNow |

### Dashboard for Metrics

**Create Power BI dashboard:**

1. **Adoption Over Time**
   - Line chart: Daily active users by language
   - Stacked area: Language distribution over time

2. **Office Breakdown**
   - Bar chart: Language adoption by office code
   - Target vs actual (80% Madrid Spanish, 90% Tokyo Japanese)

3. **Language Switching Behavior**
   - Funnel: Auto-detected → Kept vs Changed
   - Table: Language changes per session

4. **Quality Indicators**
   - KPI cards: Translation accuracy score, AI output match %
   - Table: Bug reports by category (translation, layout, encoding)

5. **Performance Tracking**
   - Line chart: Load time over time (before/after)
   - Line chart: Bundle size over time

---

## Cost Summary

### One-Time Costs

| Item | Hours | Cost @ $100/hr | Notes |
|------|-------|----------------|-------|
| **Development** | | | |
| Setup & configuration | 8 | $800 | i18n lib, config, hooks |
| Translation file creation | 16 | $1,600 | Extract strings, structure |
| Component updates | 40 | $4,000 | Update all UI components |
| AI agent integration | 8 | $800 | Update prompt, test |
| Japanese-specific work | 8 | $800 | Fonts, encoding, formatting |
| Testing | 16 | $1,600 | Unit, integration, visual |
| Documentation | 8 | $800 | User guides, internal docs |
| **Subtotal Development** | **104 hrs** | **$10,400** | |
| | | | |
| **Translation Services** | | | |
| Spanish review (Madrid) | — | $500 | Native speaker review |
| Japanese review (Tokyo) | — | $1,000 | Native speaker review |
| **Subtotal Translation** | | **$1,500** | |
| | | | |
| **TOTAL ONE-TIME** | **104 hrs** | **$11,900** | |

### Ongoing Costs

| Item | Frequency | Cost/Year | Notes |
|------|-----------|-----------|-------|
| Translation updates | Per feature | $400 | ~2 features/year, $200 each |
| Native speaker reviews | Quarterly | $400 | $100 per review, 4/year |
| Font licensing | Annual | $0 | Using free fonts (Noto Sans JP) |
| Bundle size hosting | Monthly | $0 | <1kb/month extra |
| **TOTAL ONGOING** | | **$800/year** | |

### ROI Calculation

**Benefits:**
- Improved adoption in Madrid/Tokyo: +15% engagement = +30 users actively using
- Reduced support burden: English-only barriers removed
- Professional image: Demonstrates global commitment
- Future expansion: Foundation for French (Toronto), German, etc.

**Intangible benefits:**
- User satisfaction
- Reduced cognitive load for non-English speakers
- Competitive advantage

---

## Appendix

### A. Related Documents

- `AGENT-SYSTEM-PROMPT.md` - Original system prompt (documented)
- `AGENT-SYSTEM-PROMPT-UPDATED.md` - Updated prompt with language support
- `POWERBI-LOGIN-TELEMETRY.md` - Existing telemetry guide
- `TELEMETRY-PRIVACY.md` - Privacy compliance documentation
- Translation files: `locales/{en,es,ja}/*.json`

### B. Reference Links

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Tailwind CSS Typography Plugin](https://tailwindcss.com/docs/typography-plugin)
- [Noto Sans JP Font](https://fonts.google.com/noto/specimen/Noto+Sans+JP)
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)

### C. Contact Information

**For questions:**
- Technical issues: IPCT Team
- Translation questions: Madrid office (Spanish), Tokyo office (Japanese)
- Product decisions: Product Manager
- User feedback: User Support

---

**Document End**
