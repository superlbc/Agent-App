import { Audience, Tone, ViewMode, FormState, Controls, MeetingPreset, CoachingStyle } from './types.ts';

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

export const SAMPLE_DATA: FormState = {
  title: "ACL Weekly Team Status – 8/26",
  agenda: "ACL Nights Show\nMain Footprint\nSide Stage",
  transcript: "Alright team, let's kick off. Main footprint status? John reports we are green on talent booking. Let's talk about the side stage. We need to finalize the audio vendor by EOD Friday. Casey to mock up blanket and hat designs, due date is 2025-09-02. This is for the ACL Nights show. Sarah, can you please coordinate with the city on permits? Make sure to check with legal@example.com before signing anything. Their number is (555) 123-4567. We need a decision on the catering options for the VIP area. That's a key risk if we don't lock it down. Bob will own the decision on catering.",
  transcriptSource: 'manual',
};

export const MEETING_PRESET_OPTIONS: { value: Exclude<MeetingPreset, 'custom'>; labelKey: string }[] = [
    { value: 'internal-sync', labelKey: 'constants:presets.internalSync.name' },
    { value: 'client-update', labelKey: 'constants:presets.clientUpdate.name' },
    { value: 'brainstorm', labelKey: 'constants:presets.brainstorm.name' },
    { value: 'executive-briefing', labelKey: 'constants:presets.executiveBriefing.name' },
];

export const PRESET_CONFIGS: Record<Exclude<MeetingPreset, 'custom'>, Partial<Controls> & { description: string }> = {
    'client-update': {
        audience: 'cross-functional',
        tone: 'client-ready',
        redact: true,
        critical_lens: false,
        use_icons: false,
        bold_important_words: true,
        meeting_coach: true,
        coaching_style: 'gentle',
        description: "For client-facing meetings • Polished and professional output • Sensitive data redacted • Cross-functional view • Meeting coach active",
    },
    'internal-sync': {
        audience: 'department-specific',
        tone: 'professional',
        redact: false,
        critical_lens: true,
        use_icons: true,
        bold_important_words: true,
        meeting_coach: true,
        coaching_style: 'gentle',
        description: "For internal team meetings • Granular details for your department • Professional tone • Includes critical review • Key points highlighted • Meeting coach provides facilitation tips",
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
        description: "For creative sessions • Concise format focusing on ideas • Critical review enabled • Cross-team perspective • Key points highlighted • Meeting coach active",
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
        description: "For leadership updates • Executive summary format • Sensitive data redacted • Critical review included • Key decisions highlighted • Meeting coach active",
    }
};