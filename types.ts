
export interface GraphData {
  displayName?: string;
  jobTitle?: string;
  mail?: string;
  photoUrl?: string;
}

export type Department = "BL" | "STR" | "PM" | "CR" | "XD" | "XP" | "IPCT" | "CON" | "STU" | "General";
export type ContextTag = "Client facing" | "Internal only" | "Sensitive" | "Executive review";
export type Audience = 'executive' | 'cross-functional' | 'department-specific';
export type Tone = 'professional' | 'concise' | 'client-ready';
export type ViewMode = 'full' | 'actions-only';
export type MeetingPreset = 'client-update' | 'internal-sync' | 'brainstorm' | 'executive-briefing' | 'custom';
export type CoachingStyle = 'gentle' | 'direct';

export interface NextStep {
  department: string;
  owner: string;
  task: string;
  due_date: string;
  status: 'NA' | 'GREEN' | 'AMBER' | 'RED';
  status_notes: string;
}

export interface CoachMetrics {
  agenda_coverage_pct: number;
  decision_count: number;
  action_count: number;
  actions_with_owner_pct: number;
  actions_with_due_date_pct: number;
  participants_estimated: number;
  top_speaker_share_pct: number;
}

export interface CoachFlags {
  participation_imbalance: boolean;
  many_unassigned_actions: boolean;
  few_decisions: boolean;
  light_agenda_coverage: boolean;
}

export interface CoachInsights {
  initiative: string;
  style: CoachingStyle;
  strengths: string[];
  improvements: string[];
  facilitation_tips: string[];
  metrics: CoachMetrics;
  flags: CoachFlags;
}


export interface AgentResponse {
  markdown: string;
  next_steps: NextStep[];
  coach_insights?: CoachInsights;
  suggested_questions?: string[];
}

export interface Controls {
  focus_department: Department[];
  view: ViewMode;
  critical_lens: boolean;
  audience: Audience;
  tone: Tone;
  redact: boolean;
  status_view: string;
  meeting_date: string;
  rag_mode: string;
  use_icons: boolean;
  bold_important_words: boolean;
  meetingPreset: MeetingPreset;
  meeting_coach: boolean;
  coaching_style: CoachingStyle;
  interrogation_mode?: boolean;
  user_question?: string;
}

export interface FormState {
  title: string;
  agenda: string;
  transcript: string;
  tags: ContextTag[];
}

export interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// Kept for apiService.ts compatibility
export interface ApiConfig {
  hostname: string;
  clientId: string;
  clientSecret:string;
  botId: string;
}

export interface AuthToken {
    accessToken: string;
    expiresAt: number;
}

export interface Payload {
    meeting_title: string;
    agenda: string[];
    transcript: string;
    controls: Controls;
}
export interface InterrogationResponse {
  question: string;
  answer: string;
  not_in_transcript: boolean;
  follow_up_suggestions: string[];
}

export interface ChatMessage {
  question: string;
  answer?: string;
  not_in_transcript?: boolean;
  follow_up_suggestions?: string[];
  isError?: boolean;
}
