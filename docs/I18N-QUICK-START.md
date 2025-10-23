# i18n Quick Start Guide

## Document Information
- **Version**: 1.0
- **Date**: 2025-10-23
- **Purpose**: Quick reference for implementing i18n in Meeting Notes Generator

---

## TL;DR - What You Need to Do

### For Backend/Agent Team:

**Update the system prompt with these changes:**

1. **Add to INPUTS section** (after line 205):
```
• output_language .......... "en" | "es" | "ja" (default: "en")
  Specifies the language for ALL generated content (minutes, insights, coach, questions).
```

2. **Add new section to CORE RULES** (after line 237):
```
OUTPUT LANGUAGE RULE (APPLIES TO ALL GENERATED CONTENT)

When output_language is set, ALL generated text must be in that language.

SCOPE OF TRANSLATION:
• Meeting Title, Purpose, Section headings, Workstream names, All bullets,
  Action Items, Status Notes, Critical Review, Meeting Coach, Suggested Questions

EXCEPTIONS (KEEP IN ENGLISH):
• JSON keys, Department codes (BL, STR, etc.), Status codes in JSON ("RED", "AMBER", etc.)

LANGUAGE-SPECIFIC GUIDELINES:
Spanish (es): Use business Spanish (Spain variant), formal "usted" form
Japanese (ja): Use polite business Japanese (です/ます form), avoid casual forms

QUALITY CHECK: Verify all content is in output_language except JSON keys and codes.
```

3. **Update Console Preset Defaults** (line 362):
Add `output_language="en"` to the list.

**Full updated prompt:** See [AGENT-SYSTEM-PROMPT-UPDATED.md](./AGENT-SYSTEM-PROMPT-UPDATED.md)

---

### For Frontend Team:

**Install dependencies:**
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

**Update API call to include language:**
```typescript
// services/apiService.ts
import i18n from '../utils/i18n';

const constructPrompt = (payload: Payload): string => {
    const currentLanguage = i18n.language || 'en';

    const promptParts = [
        `<<<APP_MODE>>>`,
        // ... existing code ...
        `output_language: ${currentLanguage}`,  // ADD THIS
    ];

    return promptParts.join('\n');
};
```

**All translation files are ready in:**
- `locales/en/*.json` - English (source)
- `locales/es/*.json` - Spanish
- `locales/ja/*.json` - Japanese

---

## What's Been Created

### Documentation (3 files)
1. **I18N-IMPLEMENTATION-PLAN.md** - Complete 6-week implementation plan with all details
2. **AGENT-SYSTEM-PROMPT.md** - Original prompt (for reference)
3. **AGENT-SYSTEM-PROMPT-UPDATED.md** - Updated prompt with i18n support

### Translation Files (21 files)

**English** (`locales/en/`):
- `common.json` - Header, buttons, navigation, status messages
- `forms.json` - Form labels, placeholders, input descriptions
- `settings.json` - Settings panel, regional preferences
- `constants.json` - Audience, tone, departments, presets, offices
- `help.json` - Help modal content, features, tips, troubleshooting
- `tour.json` - Onboarding tour steps and messages
- `validation.json` - Error messages, warnings, confirmations

**Spanish** (`locales/es/`) - Same structure, professional Spanish (Spain variant)

**Japanese** (`locales/ja/`) - Same structure, polite business Japanese (keigo)

---

## Agent System Prompt Changes - Detailed

### What Changed

| Section | Change Type | Details |
|---------|-------------|---------|
| **INPUTS** | New Control | Added `output_language` flag (en/es/ja) |
| **CORE RULES** | New Section | Added OUTPUT LANGUAGE RULE (30+ lines) |
| **Console Defaults** | Update | Added `output_language="en"` to defaults |
| **INTERROGATION MODE** | Update | Added language handling for Q&A responses |

### The Key Instruction to Add

The most important addition is the **OUTPUT LANGUAGE RULE** section. Here it is in full:

```
================================================================
OUTPUT LANGUAGE RULE (APPLIES TO ALL GENERATED CONTENT)

When `output_language` is set, ALL generated text must be in that language.

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
• Interrogation Mode responses (answer, follow_up_suggestions) — translate

EXCEPTIONS (KEEP IN ENGLISH):
• JSON keys in machine-readable block — always English
  (e.g., "next_steps", "coach_insights", "question", "answer")
• Department codes — always English codes
  (BL, STR, PM, CR, XD, XP, IPCT, CON, STU, General)
• Status codes in JSON — always English
  ("RED", "AMBER", "GREEN", "NA")
• Boolean/enum values in JSON — always English
  (true, false, "gentle", "direct", etc.)
• Table column headers for Next Steps — keep in English
  (Department, Owner, Task, Due Date, Status, Status Notes)

LANGUAGE-SPECIFIC GUIDELINES:

Spanish (es):
• Use business Spanish (Spain variant for Madrid office)
• Formal "usted" form when addressing users in coach insights
• Professional tone; avoid colloquialisms or regional slang
• Preserve markdown formatting exactly as English
• Translate section headings:
  - "WORKSTREAM NOTES" → "NOTAS DE WORKSTREAM"
  - "NEXT STEPS" → "PRÓXIMOS PASOS"
  - "CURRENT STATUS" → "ESTADO ACTUAL"
  - "CRITICAL REVIEW" → "REVISIÓN CRÍTICA"

Japanese (ja):
• Use polite business Japanese (敬語 keigo style, です/ます form)
• Maintain professional tone; avoid casual forms (だ/である)
• Preserve markdown formatting exactly as English
• Keep proper nouns in original language unless translated in transcript
• Translate section headings:
  - "WORKSTREAM NOTES" → "ワークストリーム ノート"
  - "NEXT STEPS" → "次のステップ"
  - "CURRENT STATUS" → "現在の状況"
  - "CRITICAL REVIEW" → "重要なレビュー"

MIXED-LANGUAGE SCENARIOS:
• If transcript is in English but output_language=es or ja:
  - Translate all generated content to the output_language
  - Preserve direct quotes from speakers in their original language
  - Summarized or paraphrased content should be in output_language
• If transcript contains mixed languages:
  - Output all generated content in output_language only
  - Preserve proper nouns, person names, project codenames in original form

QUALITY CHECK (before responding):
• Verify ALL section headings are in output_language (except JSON keys)
• Verify ALL generated sentences/bullets are in output_language
• Verify JSON keys remain in English
• Verify department codes remain as English abbreviations
• Verify status codes in JSON remain as English
================================================================
```

---

## Testing Checklist

### Backend Testing (Agent)

Test with these 4 scenarios:

**Test 1: English (default)**
```
output_language: en
Expected: All output in English (current behavior)
```

**Test 2: Spanish output**
```
output_language: es
Expected: All headings/content in Spanish, JSON keys in English
```

**Test 3: Japanese output**
```
output_language: ja
Expected: All headings/content in Japanese (polite form), JSON keys in English
```

**Test 4: Mixed language transcript**
```
Transcript in English, output_language: es
Expected: Generated content in Spanish, speaker quotes in English
```

### Frontend Testing

After implementing i18n infrastructure:

1. ✅ Language selector appears in header menu
2. ✅ Language preference stored in localStorage
3. ✅ All UI text updates when language switched
4. ✅ Language persists after page refresh
5. ✅ `output_language` sent to agent API
6. ✅ Generated notes match selected language
7. ✅ CSV export works with Japanese characters (UTF-8 BOM)

---

## Files to Update (Frontend)

### Create New Files:
1. `utils/i18n.ts` - i18next configuration
2. `hooks/useLanguage.ts` - Language management hook
3. `components/LanguageSelector.tsx` - Language picker UI
4. All translation files (already created)

### Update Existing Files:
1. `index.tsx` - Wrap with I18nextProvider
2. `services/apiService.ts` - Add `output_language` to prompt
3. `utils/export.ts` - Add UTF-8 BOM for Japanese CSVs
4. `constants.ts` - Change `label` to `labelKey`, map to translations
5. `components/Header.tsx` - Add language selector to menu
6. `components/SettingsDrawer.tsx` - Add regional settings section
7. `components/InputPanel.tsx` - Use `t()` for all text
8. `components/OutputPanel.tsx` - Use `t()` for all text
9. `components/HelpModal.tsx` - Use `t()` for all content
10. `components/tour/*` - Use `t()` for all tour content
11. `utils/telemetryService.ts` - Add language tracking

---

## Language Selector Component Preview

**Where it appears:**
- Header user menu (between "Toggle Theme" and "Replay Tutorial")
- Settings drawer (new "Regional Settings" section)

**UI Design:**
```
🌐 Language: English 🇺🇸  [dropdown]
  ├─ 🇺🇸 English
  ├─ 🇪🇸 Español
  └─ 🇯🇵 日本語
```

**Behavior:**
- Immediately switches all UI text
- Saves to localStorage: `appLanguage`
- Tracks via telemetry: `languageChanged` event
- Page does NOT reload (runtime switching)

---

## Office Location Defaults

Auto-detection based on timezone:

| Office | Timezone | Default Language |
|--------|----------|------------------|
| ATL, CHI, NYC, STL (US) | America/New_York, America/Chicago | English (en) |
| LDN (UK) | Europe/London | English (en) |
| TOR (CA) | America/Toronto | English (en) |
| MAD (ES) | Europe/Madrid | Spanish (es) |
| TYO (JP) | Asia/Tokyo | Japanese (ja) |

**Fallback order:**
1. User preference (localStorage)
2. Browser language
3. Timezone-based
4. Default: English

---

## Translation Quality Notes

### Spanish Translations:
- ✅ Professional business Spanish (Spain variant)
- ✅ Formal "usted" form (appropriate for business)
- ✅ Consistent terminology across all files
- ⚠️ Recommend review by Madrid office native speaker

### Japanese Translations:
- ✅ Polite business Japanese (です/ます form)
- ✅ Professional keigo style
- ✅ Appropriate for Tokyo office
- ⚠️ Recommend review by Tokyo office native speaker

**All translations are AI-generated and should be reviewed by native speakers before production deployment.**

---

## Costs Summary

| Item | Cost | Timeline |
|------|------|----------|
| Development (96 hours @ $100/hr) | $9,600 | 4 weeks |
| Native speaker reviews (ES + JA) | $1,500 | 1 week |
| Testing & UAT | Included | 1 week |
| **Total One-Time** | **$11,100** | **6 weeks** |
| Ongoing maintenance | $800/year | Continuous |

---

## Next Steps

### Week 1: Foundation
- [ ] Install i18n dependencies
- [ ] Create i18n configuration file
- [ ] Update backend system prompt
- [ ] Test agent with all 3 languages

### Week 2: UI Implementation
- [ ] Create language selector component
- [ ] Update all UI components with translations
- [ ] Add language preference storage
- [ ] Test language switching

### Week 3: Integration
- [ ] Connect frontend language to agent API
- [ ] Japanese-specific fixes (fonts, encoding)
- [ ] Test full workflow in all languages

### Week 4: Review & Polish
- [ ] Native speaker review (Spanish)
- [ ] Native speaker review (Japanese)
- [ ] Fix any translation issues
- [ ] Final testing

### Week 5: UAT
- [ ] Beta test with Madrid office (2-3 users)
- [ ] Beta test with Tokyo office (2-3 users)
- [ ] Collect feedback
- [ ] Make adjustments

### Week 6: Rollout
- [ ] Deploy to production
- [ ] Monitor adoption metrics
- [ ] Support users
- [ ] Iterate based on feedback

---

## Support & Contacts

**For implementation questions:**
- Technical: IPCT Team
- Spanish translations: Madrid office contact
- Japanese translations: Tokyo office contact
- Product decisions: Product Manager

**For testing:**
- Madrid office: Volunteer 2-3 Spanish speakers for UAT
- Tokyo office: Volunteer 2-3 Japanese speakers for UAT

---

## Key Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Madrid adoption | 80% use Spanish | Telemetry: % MAD users with `appLanguage=es` |
| Tokyo adoption | 90% use Japanese | Telemetry: % TYO users with `appLanguage=ja` |
| Agent output match | 98%+ | % notes in correct language |
| Translation quality | 4.5+/5 | UAT feedback score |
| No performance impact | <50ms load time increase | Lighthouse CI |

---

## Related Documents

- **[I18N-IMPLEMENTATION-PLAN.md](./I18N-IMPLEMENTATION-PLAN.md)** - Full 6-week plan with all details
- **[AGENT-SYSTEM-PROMPT.md](./AGENT-SYSTEM-PROMPT.md)** - Original prompt (documented)
- **[AGENT-SYSTEM-PROMPT-UPDATED.md](./AGENT-SYSTEM-PROMPT-UPDATED.md)** - Updated prompt with i18n
- **Translation files**: `locales/{en,es,ja}/*.json`

---

**Ready to implement? Start with Week 1 tasks!**

---

**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Maintained By**: IPCT Team
