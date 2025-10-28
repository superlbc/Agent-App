import { Department, ContextTag, Audience, Tone, ViewMode, FormState, Controls, MeetingPreset, CoachingStyle } from './types.ts';

export const DEPARTMENT_OPTIONS: Department[] = ["BL", "STR", "PM", "CR", "XD", "XP", "IPCT", "CON", "STU", "General"];

// Context tags with translation keys
export const CONTEXT_TAG_OPTIONS: { value: ContextTag; labelKey: string }[] = [
  { value: "Client facing", labelKey: "constants:contextTags.clientFacing" },
  { value: "Internal only", labelKey: "constants:contextTags.internalOnly" },
  { value: "Sensitive", labelKey: "constants:contextTags.sensitive" },
  { value: "Executive review", labelKey: "constants:contextTags.executiveReview" },
];

// Legacy array for backwards compatibility
export const CONTEXT_TAG_VALUES: ContextTag[] = ["Client facing", "Internal only", "Sensitive", "Executive review"];
export const AUDIENCE_OPTIONS: { value: Audience; labelKey: string }[] = [
  { value: 'executive', labelKey: 'constants:audience.executive' },
  { value: 'cross-functional', labelKey: 'constants:audience.crossFunctional' },
  // FIX: Changed 'department' to 'department-specific' to match the Audience type.
  { value: 'department-specific', labelKey: 'constants:audience.departmentSpecific' },
];
export const AUDIENCE_BUTTON_OPTIONS: { value: Audience; labelKey: string }[] = [
  { value: 'executive', labelKey: 'constants:audienceShort.executive' },
  { value: 'cross-functional', labelKey: 'constants:audienceShort.crossFunctional' },
  { value: 'department-specific', labelKey: 'constants:audienceShort.departmentSpecific' },
];
export const TONE_OPTIONS: { value: Tone; labelKey: string }[] = [
  { value: 'professional', labelKey: 'constants:tone.professional' },
  { value: 'concise', labelKey: 'constants:tone.concise' },
  { value: 'client-ready', labelKey: 'constants:tone.clientReady' },
];
export const VIEW_MODE_OPTIONS: { value: ViewMode; labelKey: string }[] = [
    { value: 'full', labelKey: 'constants:view.full' },
    { value: 'actions-only', labelKey: 'constants:view.actionsOnly' },
];

export const COACHING_STYLE_OPTIONS: { value: CoachingStyle; labelKey: string }[] = [
  { value: 'gentle', labelKey: 'constants:coachingStyle.gentle' },
  { value: 'direct', labelKey: 'constants:coachingStyle.direct' },
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
  transcriptSource: 'manual',
  tags: ["Internal only"],
};

export const MEETING_PRESET_OPTIONS: { value: Exclude<MeetingPreset, 'custom'>; labelKey: string }[] = [
    { value: 'client-update', labelKey: 'constants:presets.clientUpdate.name' },
    { value: 'internal-sync', labelKey: 'constants:presets.internalSync.name' },
    { value: 'brainstorm', labelKey: 'constants:presets.brainstorm.name' },
    { value: 'executive-briefing', labelKey: 'constants:presets.executiveBrief.name' },
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