import { AgentResponse, NextStep, CoachInsights } from '../types';

export const SAMPLE_AGENT_RESPONSE = `ACL Weekly Team Status – 11/26
Meeting Purpose: Review status updates for ACL event components including ACL Nights show, main footprint and side stage.
🔷🔷 WORKSTREAM NOTES 🔷🔷
🔸 ACL NIGHTS SHOW 🔸
🎯 KEY DISCUSSION POINTS
- Casey will mock up blanket and hat designs
- Sarah needs to coordinate with the city on permits
- Need to check with legal before signing anything
- Catering options for VIP area need to be decided
✅ DECISIONS MADE
- Bob will own the decision on catering
❓ RISKS OR OPEN QUESTIONS
- Catering for VIP area identified as a key risk if not locked down soon
---
🔸 MAIN FOOTPRINT 🔸
🎯 KEY DISCUSSION POINTS
- John reported that talent booking is green (on track)
✅ DECISIONS MADE
- No notes for this section.
❓ RISKS OR OPEN QUESTIONS
- No notes for this section.
---
🔸 SIDE STAGE 🔸
🎯 KEY DISCUSSION POINTS
- Audio vendor needs to be finalized by EOD Friday
✅ DECISIONS MADE
- No notes for this section.
❓ RISKS OR OPEN QUESTIONS
- No notes for this section.
---
🔷🔷 NEXT STEPS 🔷🔷
| Department | Owner | Task | Due Date | Status | Status Notes |
|---|---|---|---|---|---|
| XD | Casey | Mock up blanket and hat designs | 2025-09-02 | 🟩 | Clear task with due date |
| General | Sarah | Coordinate with city on permits and check with legal before signing | Not specified | 🟧 | Missing due date |
| General | Bob | Make decision on catering options for VIP area | Not specified | 🟧 | Missing due date, identified as key risk |
| General | Unassigned | Finalize audio vendor | EOD Friday | 🟧 | Missing specific owner |
---
🔷🔷 CRITICAL REVIEW 🔷🔷
### Gaps / Missing Topics
- No discussion of budget constraints or approvals
- Timeline for overall event not addressed
- No mention of marketing or promotional activities
- Staffing requirements not discussed
### Risk Assessment
- MEDIUM - VIP catering decision explicitly mentioned as a key risk without a timeline
- MEDIUM - Audio vendor finalization has a deadline but no assigned owner
- LOW - Permit coordination with the city needs legal review, but process is defined
### Unassigned / Ambiguous Tasks
- Audio vendor finalization needs a clear owner. Suggestion: [XP]
- No specific timeline for Sarah's permit coordination with the city
---
\`\`\`json
{
  "next_steps": [
    {
      "department": "XD",
      "owner": "Casey",
      "task": "Mock up blanket and hat designs",
      "due_date": "2025-09-02",
      "status": "GREEN",
      "status_notes": "Clear task with due date"
    },
    {
      "department": "General",
      "owner": "Sarah",
      "task": "Coordinate with city on permits and check with legal before signing",
      "due_date": "Not specified",
      "status": "AMBER",
      "status_notes": "Missing due date"
    },
    {
      "department": "General",
      "owner": "Bob",
      "task": "Make decision on catering options for VIP area",
      "due_date": "Not specified",
      "status": "AMBER",
      "status_notes": "Missing due date, identified as key risk"
    },
    {
      "department": "General",
      "owner": "Unassigned",
      "task": "Finalize audio vendor",
      "due_date": "EOD Friday",
      "status": "AMBER",
      "status_notes": "Missing specific owner"
    }
  ],
  "coach_insights": {
    "initiative": "Meeting Excellence",
    "style": "gentle",
    "strengths": [
      "All **agenda items** were covered in the discussion",
      "Clear **ownership** assigned for some key tasks",
      "**Risk identification** was present (VIP catering flagged as key risk)"
    ],
    "improvements": [
      "Ensure **all tasks** have both **owners** and **due dates**",
      "Consider adding **decision documentation** for more items beyond catering",
      "Establish **clear next steps** for identified risks"
    ],
    "facilitation_tips": [
      "End each topic with a **quick summary** of owners and due dates",
      "Use a **round-robin** approach to ensure all participants contribute",
      "Create a **parking lot** for items that need follow-up outside the meeting"
    ],
    "metrics": {
      "agenda_coverage_pct": 100,
      "decision_count": 1,
      "action_count": 4,
      "actions_with_owner_pct": 75,
      "actions_with_due_date_pct": 50,
      "participants_estimated": 4,
      "top_speaker_share_pct": 40
    },
    "flags": {
      "participation_imbalance": false,
      "many_unassigned_actions": true,
      "few_decisions": true,
      "light_agenda_coverage": false
    }
  }
}
\`\`\`
`;

export const parseSampleAgentResponse = (responseText: string): AgentResponse => {
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = responseText.match(jsonBlockRegex);

  if (match && match[1]) {
    const jsonString = match[1];
    const markdown = responseText.replace(jsonBlockRegex, '').trim();
    try {
      const parsedJson: { next_steps: NextStep[], coach_insights?: CoachInsights } = JSON.parse(jsonString);
      return {
        markdown,
        next_steps: parsedJson.next_steps || [],
        coach_insights: parsedJson.coach_insights,
      };
    } catch (error) {
      console.error("Failed to parse JSON block from sample agent response:", error);
      return { markdown: responseText, next_steps: [], coach_insights: undefined };
    }
  }

  // Fallback if no JSON block is found
  return { markdown: responseText, next_steps: [], coach_insights: undefined };
};
