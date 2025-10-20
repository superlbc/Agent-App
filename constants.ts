import { Department, ContextTag, Audience, Tone, ViewMode, FormState, Controls, MeetingPreset, CoachingStyle } from './types.ts';

export const DEPARTMENT_OPTIONS: Department[] = ["BL", "STR", "PM", "CR", "XD", "XP", "IPCT", "CON", "STU", "General"];
export const CONTEXT_TAG_OPTIONS: ContextTag[] = ["Client facing", "Internal only", "Sensitive", "Executive review"];
export const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'executive', label: 'Executive (high-level)' },
  { value: 'cross-functional', label: 'Cross-functional team (balanced)' },
  // FIX: Changed 'department' to 'department-specific' to match the Audience type.
  { value: 'department-specific', label: 'Department-specific (granular)' },
];
export const AUDIENCE_BUTTON_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'executive', label: 'Executive' },
  { value: 'cross-functional', label: 'Cross-functional' },
  { value: 'department-specific', label: 'Department' },
];
export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'concise', label: 'Concise' },
  { value: 'client-ready', label: 'Client-ready' },
];
export const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
    { value: 'full', label: 'Full minutes' },
    { value: 'actions-only', label: 'Actions only' },
];

export const COACHING_STYLE_OPTIONS: { value: CoachingStyle; label: string }[] = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'direct', label: 'Direct' },
];

export const DEPARTMENT_LEGEND: Record<Department, string> = {
  BL: "Brand & Licensing",
  STR: "Strategy & Insights",
  PM: "Product Management",
  CR: "Creative Direction",
  XD: "Experience Design",
  XP: "Experience Production",
  IPCT: "IP & Content",
  CON: "Consumer Insights",
  STU: "Studio Operations",
  General: "General / Cross-functional",
};

export const SAMPLE_DATA: FormState = {
  title: "ACL Weekly Team Status – 8/26",
  agenda: "ACL Nights Show\nMain Footprint\nSide Stage",
  transcript: "Alright team, let's kick off. Main footprint status? John reports we are green on talent booking. Let's talk about the side stage. We need to finalize the audio vendor by EOD Friday. Casey to mock up blanket and hat designs, due date is 2025-09-02. This is for the ACL Nights show. Sarah, can you please coordinate with the city on permits? Make sure to check with legal@example.com before signing anything. Their number is (555) 123-4567. We need a decision on the catering options for the VIP area. That's a key risk if we don't lock it down. Bob will own the decision on catering.",
  tags: ["Internal only"],
};

export const MEETING_PRESET_OPTIONS: { value: Exclude<MeetingPreset, 'custom'>; label: string }[] = [
    { value: 'client-update', label: 'Client Update' },
    { value: 'internal-sync', label: 'Internal Sync' },
    { value: 'brainstorm', label: 'Brainstorm' },
    { value: 'executive-briefing', label: 'Executive Briefing' },
];

export const PRESET_CONFIGS: Record<Exclude<MeetingPreset, 'custom'>, Partial<Controls> & { tags: ContextTag[] }> = {
    'client-update': {
        audience: 'cross-functional',
        tone: 'client-ready',
        redact: true,
        critical_lens: false,
        use_icons: false,
        bold_important_words: true,
        meeting_coach: true,
        coaching_style: 'gentle',
        tags: ["Client facing"],
    },
    'internal-sync': {
        audience: 'department-specific',
        tone: 'professional',
        redact: false,
        critical_lens: true,
        use_icons: true,
        bold_important_words: false,
        meeting_coach: true,
        coaching_style: 'gentle',
        tags: ["Internal only"],
    },
    brainstorm: {
        audience: 'cross-functional',
        tone: 'concise',
        redact: false,
        critical_lens: true,
        use_icons: true,
        bold_important_words: true,
        meeting_coach: true,
        coaching_style: 'gentle',
        tags: ["Internal only"],
    },
    'executive-briefing': {
        audience: 'executive',
        tone: 'concise',
        redact: true,
        critical_lens: true,
        use_icons: false,
        bold_important_words: true,
        meeting_coach: true,
        coaching_style: 'gentle',
        tags: ["Executive review", "Sensitive"],
    }
};