# Priority 3.2: Participant Context Integration - Visual Representation

## 1. DATA FLOW ARCHITECTURE (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE (App.tsx)                            │
│                                                                               │
│  ┌─────────────────────┐         ┌──────────────────────┐                  │
│  │  InputPanel         │         │  Meeting Participants │                  │
│  │  - Title            │         │  Panel                │                  │
│  │  - Agenda           │         │  ┌────────────────┐   │                  │
│  │  - Transcript       │         │  │ John Smith     │   │                  │
│  │  - Controls         │         │  │ [BL] Director  │   │                  │
│  └─────────────────────┘         │  │ ✓ accepted     │   │                  │
│           │                       │  └────────────────┘   │                  │
│           │                       │  ┌────────────────┐   │                  │
│           │                       │  │ Sarah Jones    │   │                  │
│           │                       │  │ [STR] Lead     │   │                  │
│           │                       │  │ ⊗ declined     │   │                  │
│           │                       │  └────────────────┘   │                  │
│           │                       └──────────────────────┘                  │
│           │                                  │                                │
│           └──────────────┬───────────────────┘                                │
│                          │                                                    │
│                     [Generate]                                                │
│                          │                                                    │
└──────────────────────────┼────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAYLOAD CONSTRUCTION (App.tsx)                            │
│                                                                               │
│   const payload: Payload = {                                                 │
│     meeting_title: formState.title,                                          │
│     agenda: formState.agenda.split('\n'),                                    │
│     transcript: formState.transcript,                                        │
│     participants: participants,  // ◄── NEW: Include participant array       │
│     controls: controls                                                       │
│   }                                                                           │
│                                                                               │
└──────────────────────────┬────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              PARTICIPANT CONTEXT BUILDER (utils/participantContext.ts)       │
│                                                                               │
│   buildParticipantContext(participants: Participant[]): string               │
│                                                                               │
│   1. Group by type:                                                          │
│      • Internal (Momentum employees)                                         │
│      • External (clients/vendors)                                            │
│                                                                               │
│   2. For internal: Group by department (BL, STR, PM, etc.)                   │
│                                                                               │
│   3. For each participant, format:                                           │
│      [DEPT] Name (email) - Job Title                                         │
│        Status: acceptance (attendanceType)                                   │
│                                                                               │
│   4. Return formatted string ──────────────────────┐                         │
│                                                     │                         │
└─────────────────────────────────────────────────────┼─────────────────────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 PROMPT CONSTRUCTION (apiService.ts)                          │
│                                                                               │
│   constructPrompt(payload: Payload): string                                  │
│                                                                               │
│   <<<APP_MODE>>>                                                             │
│   Meeting Title: {title}                                                     │
│                                                                               │
│   Agenda:                                                                    │
│   {agenda items}                                                             │
│                                                                               │
│   Transcript:                                                                │
│   {transcript text}                                                          │
│                                                                               │
│   Participants:                    ◄── NEW SECTION                           │
│   INTERNAL PARTICIPANTS (Momentum Worldwide):                                │
│   [BL] John Smith (john@momentumww.com) - Account Director                   │
│     Status: accepted (required)                                              │
│   [STR] Sarah Jones (sarah@momentumww.com) - Strategy Lead                   │
│     Status: declined (optional)                                              │
│                                                                               │
│   EXTERNAL PARTICIPANTS:                                                     │
│   David Brown (david@client.com) - Acme Corp - VP Marketing                  │
│     Status: accepted (required)                                              │
│                                                                               │
│   Controls:                                                                  │
│   {control flags}                                                            │
│   output_language: en                                                        │
│                                                                               │
└──────────────────────────┬────────────────────────────────────────────────────┘
                           │
                           │ POST /api/chat-ai/v1/bots/{botId}/messages
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI AGENT (Claude via Interact API)                      │
│                                                                               │
│   Uses: AGENT-SYSTEM-PROMPT-V3-PARTICIPANTS.md                               │
│                                                                               │
│   1. Parse participant list                                                  │
│   2. Match transcript speakers to participants                               │
│   3. Assign departments using participant data                               │
│   4. IF attendance data present:                                             │
│      • Calculate participation metrics                                       │
│      • Identify silent stakeholders                                          │
│      • Flag declined/tentative attendees                                     │
│   5. Generate meeting notes with enriched context                            │
│   6. Return markdown + JSON with optional participation_metrics              │
│                                                                               │
└──────────────────────────┬────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RESPONSE PROCESSING (apiService.ts)                    │
│                                                                               │
│   AgentResponse {                                                            │
│     markdown: string,                                                        │
│     next_steps: NextStep[],                                                  │
│     suggested_questions: string[],                                           │
│     coach_insights?: {                                                       │
│       metrics: {...},                                                        │
│       participation_metrics?: {...},  ◄── NEW: Optional attendance metrics   │
│       flags: {...},                                                          │
│       strengths: [...],                                                      │
│       improvements: [...],                                                   │
│       facilitation_tips: [...]                                               │
│     }                                                                         │
│   }                                                                           │
│                                                                               │
└──────────────────────────┬────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OUTPUT PANEL (UI Display)                            │
│                                                                               │
│   • Meeting notes with department-aware action items                         │
│   • Meeting Coach cards with participation insights                          │
│   • Health Snapshot with attendance metrics visualization                    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PARTICIPANT DATA STRUCTURE (TypeScript Interfaces)

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// INPUT: Participant Interface (Already Exists in types.ts)
// ═══════════════════════════════════════════════════════════════════════════

interface Participant {
  id: string;
  extractedText: string;
  matched: boolean;
  matchConfidence?: 'high' | 'medium' | 'low';
  isExternal?: boolean;
  participantType?: 'internal' | 'external' | 'unknown';

  // Graph API data (if matched)
  graphId?: string;
  displayName?: string;
  jobTitle?: string;           // ◄── Used for department inference
  department?: string;         // ◄── Used for action item assignment
  companyName?: string;        // ◄── Distinguishes external participants
  officeLocation?: string;
  email?: string;
  photoUrl?: string;

  // Presence info
  presence?: PresenceData;

  // CSV import data (attendance enrichment)
  acceptanceStatus?: 'accepted' | 'declined' | 'tentative' | 'noResponse' | 'organizer';
  attendanceType?: 'required' | 'optional';  // ◄── Used for participation metrics
  source?: 'transcript' | 'csv' | 'manual' | 'emailList';

  // UI state
  isSearching?: boolean;
  searchError?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW: Extended Payload Interface (types.ts)
// ═══════════════════════════════════════════════════════════════════════════

interface Payload {
  meeting_title: string;
  agenda: string[];
  transcript: string;
  participants?: Participant[];  // ◄── NEW: Optional participant array
  controls: Controls;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW: Extended CoachInsights Interface (types.ts)
// ═══════════════════════════════════════════════════════════════════════════

interface ParticipationMetrics {
  total_attendees: number;
  speakers_identified: number;
  participation_rate_pct: number;
  silent_stakeholders_count: number;
  silent_stakeholders_names: string[];
  required_attendees: number;
  optional_attendees: number;
  acceptance_breakdown: {
    accepted: number;
    declined: number;
    tentative: number;
    noResponse: number;
    organizer: number;
  };
  internal_count: number;
  external_count: number;
  department_representation: Department[];
}

interface CoachFlags {
  participation_imbalance: boolean;
  many_unassigned_actions: boolean;
  few_decisions: boolean;
  light_agenda_coverage: boolean;
  low_participation_rate: boolean;        // ◄── NEW: <50% spoke
  silent_required_attendees: boolean;     // ◄── NEW: Required attendees silent
}

interface CoachInsights {
  initiative: string;
  style: CoachingStyle;
  strengths: string[];
  improvements: string[];
  facilitation_tips: string[];
  metrics: CoachMetrics;
  participation_metrics?: ParticipationMetrics;  // ◄── NEW: Optional
  flags: CoachFlags;
}
```

---

## 3. PARTICIPANT CONTEXT FORMAT (What Agent Receives)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FORMATTED PARTICIPANT SECTION                       │
│                     (Injected into Agent Prompt String)                      │
└─────────────────────────────────────────────────────────────────────────────┘

Participants:

INTERNAL PARTICIPANTS (Momentum Worldwide):
┌──────────────────────────────────────────────────────────────────────────┐
│ [BL] John Smith (john.smith@momentumww.com) - Account Director           │
│   Status: accepted (required)                                            │
│   Source: csv                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│ [STR] Sarah Jones (sarah.jones@momentumww.com) - Senior Strategist       │
│   Status: declined (optional)                                            │
│   Source: csv                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│ [PM] Mike Chen (mike.chen@momentumww.com) - Project Manager              │
│   Status: accepted (required)                                            │
│   Source: manual                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│ [IPCT] Alice Wang (alice.wang@momentumww.com) - Full-Stack Developer     │
│   Status: tentative (optional)                                           │
│   Source: transcript                                                     │
└──────────────────────────────────────────────────────────────────────────┘

EXTERNAL PARTICIPANTS:
┌──────────────────────────────────────────────────────────────────────────┐
│ David Brown (david.brown@acmecorp.com) - Acme Corp - VP of Marketing     │
│   Status: accepted (required)                                            │
│   Source: csv                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│ Lisa Green (lisa.green@vendor.com) - Vendor Co - Technical Consultant    │
│   Status: noResponse (optional)                                          │
│   Source: emailList                                                      │
└──────────────────────────────────────────────────────────────────────────┘

PARTICIPANT SOURCE LEGEND:
• transcript  = Inferred from speaker names (may have limited data)
• csv        = Imported from meeting invite (includes attendance status)
• manual     = Manually added by user (complete profile from Graph API)
• emailList  = Added from pasted email list
```

---

## 4. ROLE-TO-DEPARTMENT MAPPING LOGIC

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DEPARTMENT INFERENCE HEURISTICS                         │
│                  (Applied when department field is missing)                  │
└─────────────────────────────────────────────────────────────────────────────┘

INPUT: jobTitle (string)
OUTPUT: Department code (BL | STR | PM | CR | XD | XP | IPCT | CON | STU | General)

┌─────────────────┬──────────────────────────────────────────────────────────┐
│  DEPARTMENT     │  KEYWORD PATTERNS IN JOB TITLE                          │
├─────────────────┼──────────────────────────────────────────────────────────┤
│  BL             │  Account, Client Service, Business, Commercial,          │
│                 │  Client Director, Managing Director, Account Manager     │
├─────────────────┼──────────────────────────────────────────────────────────┤
│  STR            │  Strategy, Strategic, Insight, Research, Planning,       │
│                 │  Strategist, Planner                                     │
├─────────────────┼──────────────────────────────────────────────────────────┤
│  PM             │  Project Manager, Producer, Coordinator,                 │
│                 │  Program Manager, Delivery, PMO, Traffic                 │
├─────────────────┼──────────────────────────────────────────────────────────┤
│  CR             │  Creative, Art Director, Copywriter, Design Director,    │
│                 │  Creative Director, Writer, Designer                     │
├─────────────────┼──────────────────────────────────────────────────────────┤
│  XD             │  Experience Design, Service Design, UX,                  │
│                 │  User Experience, Interaction Design, XD                 │
├─────────────────┼──────────────────────────────────────────────────────────┤
│  XP             │  Experience Production, Production Manager,              │
│                 │  Technical Production, Fabrication, Build                │
├─────────────────┼──────────────────────────────────────────────────────────┤
│  IPCT           │  Developer, Engineer, Technology, Technical, Software,   │
│                 │  Front-end, Back-end, Full-stack, Innovation, Prototype  │
├─────────────────┼──────────────────────────────────────────────────────────┤
│  CON            │  Content, Video, Photo, Film, Editor, Motion,            │
│                 │  Cinematographer, Photographer, Post-Production          │
├─────────────────┼──────────────────────────────────────────────────────────┤
│  STU            │  Studio, Retoucher, Artworker, Graphic Design, Print,   │
│                 │  Mechanical, Traffic, Production Artist                  │
├─────────────────┼──────────────────────────────────────────────────────────┤
│  General        │  External participant (non-Momentum company), OR         │
│  (fallback)     │  No job title match found, OR                            │
│                 │  Cross-functional role, OR                               │
│                 │  Job title is generic/unclear                            │
└─────────────────┴──────────────────────────────────────────────────────────┘

ALGORITHM:
1. Check if participant has explicit `department` field → Use it
2. Check if participant is external (companyName != "Momentum Worldwide") → General
3. Parse jobTitle for keyword matches (case-insensitive, partial match)
4. If multiple matches, use first match (prioritize specificity)
5. If no matches → General

EXAMPLE:
jobTitle: "Senior Full-Stack Developer" → Match: "Full-stack" → Department: IPCT
jobTitle: "Account Director, EMEA"      → Match: "Account" → Department: BL
jobTitle: "VP of Marketing"             → No match + External → Department: General
```

---

## 5. AGENT OUTPUT WITH PARTICIPATION METRICS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTENDED COACH INSIGHTS JSON                         │
│              (Returned by Agent when attendance data is present)             │
└─────────────────────────────────────────────────────────────────────────────┘

```json
{
  "next_steps": [
    {
      "department": "BL",
      "owner": "John Smith",         ◄── Matched from Participants list
      "task": "Follow up with client on budget approval",
      "due_date": "2025-10-30",
      "status": "GREEN",
      "status_notes": "Clear owner and timeline"
    },
    {
      "department": "STR",
      "owner": "Sarah Jones",        ◄── From Participants, but declined
      "task": "Finalize positioning framework",
      "due_date": "Not specified",
      "status": "RED",
      "status_notes": "Assigned owner declined meeting"  ◄── NEW INSIGHT
    },
    {
      "department": "PM",
      "owner": "Mike Chen",          ◄── Silent required attendee
      "task": "Update project timeline",
      "due_date": "2025-11-01",
      "status": "AMBER",
      "status_notes": "Owner was silent in meeting, requires confirmation"
    }
  ],

  "suggested_questions": [
    "What were the key decisions made during the meeting?",
    "Why didn't Mike Chen and Alice Wang participate in the discussion?",
    "What are the risks associated with the budget approval?"
  ],

  "coach_insights": {
    "initiative": "Meeting Excellence",
    "style": "gentle",

    "strengths": [
      "Clear **action items** with specific **owners** from **4 departments**",
      "**External stakeholder** (Acme Corp) actively participated",
      "All **required attendees** from **BL** and **PM** accepted and contributed"
    ],

    "improvements": [
      "**2 required attendees** (**Mike Chen**, **Alice Wang**) didn't speak",
      "**Sarah Jones** (STR) declined but has assigned tasks",
      "Only **40% participation rate** (2 of 5 spoke)"
    ],

    "facilitation_tips": [
      "Follow up with **Mike Chen** (PM, required, silent) to confirm timeline task",
      "Reassign STR tasks or connect with **Sarah Jones** offline about her deliverables",
      "Consider async updates for silent optional attendees to improve engagement"
    ],

    "metrics": {
      "agenda_coverage_pct": 100,
      "decision_count": 3,
      "action_count": 3,
      "actions_with_owner_pct": 100,
      "actions_with_due_date_pct": 67,
      "participants_estimated": 5,
      "top_speaker_share_pct": 45
    },

    "participation_metrics": {           ◄── NEW: Only when attendance data present
      "total_attendees": 5,
      "speakers_identified": 2,
      "participation_rate_pct": 40,
      "silent_stakeholders_count": 3,
      "silent_stakeholders_names": [
        "Mike Chen",
        "Alice Wang",
        "Lisa Green"
      ],
      "required_attendees": 4,
      "optional_attendees": 1,
      "acceptance_breakdown": {
        "accepted": 3,
        "declined": 1,
        "tentative": 1,
        "noResponse": 0,
        "organizer": 0
      },
      "internal_count": 4,
      "external_count": 1,
      "department_representation": [
        "BL",
        "STR",
        "PM",
        "IPCT"
      ]
    },

    "flags": {
      "participation_imbalance": true,
      "many_unassigned_actions": false,
      "few_decisions": false,
      "light_agenda_coverage": false,
      "low_participation_rate": true,       ◄── NEW: <50% of attendees spoke
      "silent_required_attendees": true     ◄── NEW: Required attendees silent
    }
  }
}
```

---

## 6. UI IMPACT - MEETING COACH VISUALIZATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MEETING COACH CARD (UI)                             │
│                      (OutputPanel.tsx - Coach Section)                       │
└─────────────────────────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════════════════════════╗
║  🎯 MEETING EXCELLENCE INSIGHTS                                            ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ✅ STRENGTHS                                                                ║
║  • Clear action items with specific owners from 4 departments                ║
║  • External stakeholder (Acme Corp) actively participated                    ║
║  • All required attendees from BL and PM accepted and contributed            ║
║                                                                              ║
╠──────────────────────────────────────────────────────────────────────────────╣
║                                                                              ║
║  🔶 AREAS FOR IMPROVEMENT                                                    ║
║  • 2 required attendees (Mike Chen, Alice Wang) didn't speak                 ║
║  • Sarah Jones (STR) declined but has assigned tasks                         ║
║  • Only 40% participation rate (2 of 5 spoke)                                ║
║                                                                              ║
╠──────────────────────────────────────────────────────────────────────────────╣
║                                                                              ║
║  💡 FACILITATION TIPS                                                        ║
║  • Follow up with Mike Chen (PM, required, silent) to confirm timeline task  ║
║  • Reassign STR tasks or connect with Sarah Jones offline                    ║
║  • Consider async updates for silent optional attendees                      ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  📊 PARTICIPATION METRICS                       ◄── NEW SECTION              ║
╠──────────────────────────────────────────────────────────────────────────────╣
║                                                                              ║
║  Attendees:     5 total  (4 internal, 1 external)                            ║
║  Participation: 40% ████░░░░░░  (2 of 5 spoke)                               ║
║  Silent:        3 people (Mike Chen, Alice Wang, Lisa Green)                 ║
║                                                                              ║
║  Attendance Breakdown:                                                       ║
║    ✓ Accepted:    3 (60%)  ████████████                                     ║
║    ⊗ Declined:    1 (20%)  ████                                             ║
║    ⚠ Tentative:   1 (20%)  ████                                             ║
║    ? No Response: 0 (0%)                                                     ║
║                                                                              ║
║  Required vs Optional:                                                       ║
║    • 4 required attendees (3 accepted, 2 spoke)                              ║
║    • 1 optional attendee (1 tentative, 0 spoke)                              ║
║                                                                              ║
║  Department Representation:                                                  ║
║    [BL] [STR] [PM] [IPCT]                                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 7. HEALTH SNAPSHOT ENHANCEMENTS (Future Extension)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HEALTH SNAPSHOT (Proposed)                           │
│                       (OutputPanel.tsx - New Section)                        │
└─────────────────────────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════════════════════════╗
║  📈 MEETING HEALTH SNAPSHOT                                                 ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Overall Health:  🟧 AMBER                                                   ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │ Metric                        Score    Status    Notes                 │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │ Agenda Coverage               100%     🟩 GREEN  All topics covered    │ ║
║  │ Decision Count                3        🟩 GREEN  Clear decisions       │ ║
║  │ Actions with Owners           100%     🟩 GREEN  All assigned          │ ║
║  │ Actions with Due Dates        67%      🟧 AMBER  1 missing date       │ ║
║  │ Participation Rate            40%      🟥 RED    Low engagement       │ ║  ◄── NEW
║  │ Silent Required Attendees     2        🟥 RED    Follow-up needed     │ ║  ◄── NEW
║  │ Declined Key Stakeholders     1        🟧 AMBER  STR lead absent      │ ║  ◄── NEW
║  │ Speaker Balance               45%      🟧 AMBER  One dominant speaker │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  🚨 KEY RISKS:                                                               ║
║  • Mike Chen (PM, required) silent - Timeline task needs confirmation        ║
║  • Sarah Jones (STR, declined) has 1 assigned task - Reassignment needed     ║
║  • Low participation rate - 60% of attendees didn't contribute               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 8. NEXT STEPS TABLE - DEPARTMENT ACCURACY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  NEXT STEPS TABLE (Enhanced with Participant Context)        │
└─────────────────────────────────────────────────────────────────────────────┘

BEFORE (without participant context):
╔═══════════╦════════════╦═══════════════════════════════════╦═══════════╦════════╗
║ Dept      ║ Owner      ║ Task                              ║ Due Date  ║ Status ║
╠═══════════╬════════════╬═══════════════════════════════════╬═══════════╬════════╣
║ General   ║ John       ║ Follow up with client             ║ Oct 30    ║ 🟧     ║
║ General   ║ Sarah      ║ Finalize positioning framework    ║ Not spec. ║ 🟧     ║
║ PM        ║ Mike       ║ Update project timeline           ║ Nov 1     ║ 🟩     ║
╚═══════════╩════════════╩═══════════════════════════════════╩═══════════╩════════╝
Issues: Generic "General" dept, first names only, no attendance context


AFTER (with participant context):
╔═══════════╦═══════════════╦════════════════════════════════╦═══════════╦════════╗
║ Dept      ║ Owner         ║ Task                           ║ Due Date  ║ Status ║
╠═══════════╬═══════════════╬════════════════════════════════╬═══════════╬════════╣
║ BL        ║ John Smith    ║ Follow up with client on       ║ Oct 30    ║ 🟩     ║
║           ║               ║ budget approval                ║           ║        ║
║           ║               ║                                ║           ║        ║
║ STR       ║ Sarah Jones   ║ Finalize positioning framework ║ Not spec. ║ 🟥     ║
║           ║               ║ Note: Owner declined meeting   ║           ║        ║
║           ║               ║                                ║           ║        ║
║ PM        ║ Mike Chen     ║ Update project timeline        ║ Nov 1     ║ 🟧     ║
║           ║               ║ Note: Owner was silent,        ║           ║        ║
║           ║               ║ requires confirmation          ║           ║        ║
╚═══════════╩═══════════════╩════════════════════════════════╩═══════════╩════════╝
Benefits: ✓ Correct departments  ✓ Full names  ✓ Attendance context in status
```

---

## 9. CONDITIONAL LOGIC FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│         AGENT DECISION TREE: Participant Context Processing                  │
└─────────────────────────────────────────────────────────────────────────────┘

                        ┌────────────────────┐
                        │ Participants       │
                        │ section provided?  │
                        └─────────┬──────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
                  YES                           NO
                   │                             │
                   ▼                             ▼
         ┌─────────────────────┐      ┌──────────────────────┐
         │ Attendance status   │      │ Use basic extraction │
         │ data present?       │      │ from transcript only │
         └──────────┬──────────┘      │                      │
                    │                 │ • Infer departments  │
         ┌──────────┴──────────┐      │ • No participation   │
         │                     │      │   metrics            │
        YES                   NO      │ • No attendance data │
         │                     │      └──────────────────────┘
         ▼                     ▼
┌──────────────────┐  ┌──────────────────────┐
│ FULL ENRICHMENT  │  │ BASIC MATCHING ONLY  │
├──────────────────┤  ├──────────────────────┤
│                  │  │                      │
│ ✓ Match speakers │  │ ✓ Match speakers     │
│ ✓ Assign depts   │  │ ✓ Assign depts       │
│   from profiles  │  │   from profiles      │
│ ✓ Calculate      │  │ ✓ Use job titles     │
│   participation  │  │   for inference      │
│   metrics        │  │ ✗ No participation   │
│ ✓ Identify silent│  │   metrics            │
│   stakeholders   │  │ ✗ No attendance      │
│ ✓ Flag declined/ │  │   insights           │
│   tentative      │  │                      │
│ ✓ Include        │  │ Output:              │
│   participation_ │  │ • coach_insights     │
│   metrics in JSON│  │   WITHOUT            │
│                  │  │   participation_     │
│ Output:          │  │   metrics object     │
│ • coach_insights │  │                      │
│   WITH full      │  │                      │
│   participation_ │  │                      │
│   metrics object │  │                      │
│                  │  │                      │
└──────────────────┘  └──────────────────────┘
```

---

## 10. IMPLEMENTATION FILES OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FILES TO MODIFY/CREATE                                │
└─────────────────────────────────────────────────────────────────────────────┘

📁 Momo Meetings App/
│
├── 📄 types.ts                                    [MODIFY]
│   └─ Extend interfaces:
│      • Payload { participants?: Participant[] }
│      • CoachInsights { participation_metrics?: ParticipationMetrics }
│      • CoachFlags { low_participation_rate, silent_required_attendees }
│      • Add ParticipationMetrics interface
│
├── 📁 utils/
│   └── 📄 participantContext.ts                   [CREATE NEW]
│       └─ Functions:
│          • buildParticipantContext(participants: Participant[]): string
│          • inferDepartmentFromRole(jobTitle: string): Department
│          • groupByDepartment(participants: Participant[]): Map<>
│          • formatParticipantForPrompt(p: Participant): string
│
├── 📁 services/
│   └── 📄 apiService.ts                          [MODIFY]
│       └─ Update functions:
│          • constructPrompt(payload: Payload): string
│            - Add Participants section to prompt
│            - Call buildParticipantContext() if participants exist
│          • generateNotes(payload: Payload, config: ApiConfig)
│            - Accept participants in payload
│
├── 📄 App.tsx                                     [MODIFY]
│   └─ Update function:
│      • handleGenerate(formState, controls)
│        - Include participants in payload construction
│        - Only include when participants.length > 0
│
├── 📁 docs/
│   ├── 📄 AGENT-SYSTEM-PROMPT-UPDATED.md         [KEEP - Previous version]
│   ├── 📄 AGENT-SYSTEM-PROMPT-V3-PARTICIPANTS.md [NEW - Created above]
│   └── 📄 PRIORITY-3-VISUAL-REPRESENTATION.md    [NEW - This file]
│
└── 📁 components/
    └── 📄 OutputPanel.tsx                        [FUTURE: Visualize new metrics]
        └─ Potential enhancements:
           • Display participation_metrics in Coach section
           • Add Health Snapshot panel
           • Highlight silent stakeholders
```

---

**Document Version**: 1.0
**Created**: 2025-10-25
**Purpose**: Visual representation of Priority 3.2 implementation
**Related**: AGENT-SYSTEM-PROMPT-V3-PARTICIPANTS.md
