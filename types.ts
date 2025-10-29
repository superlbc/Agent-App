
export interface GraphData {
  id?: string;               // Graph API user ID for presence lookup
  displayName?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  officeLocation?: string;
  mail?: string;
  photoUrl?: string;
}

// Department is now a flexible string to support any department from Graph API
// (e.g., "Experience Design", "Global Technology", "Business Leadership", "Human Resources", "Finance", etc.)
export type Audience = 'executive' | 'cross-functional' | 'department-specific';
export type Tone = 'professional' | 'concise' | 'client-ready';
export type ViewMode = 'full' | 'actions-only';
export type MeetingPreset = 'client-update' | 'internal-sync' | 'brainstorm' | 'executive-briefing' | 'custom';
export type CoachingStyle = 'gentle' | 'direct';
export type GroupingMode = 'by-topic' | 'by-type';

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

export interface ParticipationMetrics {
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
  department_representation: string[];  // Array of department names from Graph API
}

export interface CoachFlags {
  participation_imbalance: boolean;
  many_unassigned_actions: boolean;
  few_decisions: boolean;
  light_agenda_coverage: boolean;
  low_participation_rate?: boolean;        // NEW: <50% of attendees spoke
  silent_required_attendees?: boolean;     // NEW: Required attendees didn't speak
}

export interface CoachInsights {
  initiative: string;
  style: CoachingStyle;
  strengths: string[];
  improvements: string[];
  facilitation_tips: string[];
  metrics: CoachMetrics;
  participation_metrics?: ParticipationMetrics;  // NEW: Optional attendance metrics
  flags: CoachFlags;
}


// Structured data types for modern UI rendering
export interface EmphasisMarker {
  type: 'person' | 'date' | 'status' | 'task' | 'department' | 'monetary' | 'deadline' | 'risk' | 'general';
  value: string;  // The exact text to emphasize (client will find position)
}

export interface EmphasisedText {
  text: string;
  emphasis?: EmphasisMarker[];
}

export interface WorkstreamNote {
  workstream_name: string;
  key_discussion_points?: EmphasisedText[];
  decisions_made?: EmphasisedText[];
  risks_or_open_questions?: (EmphasisedText & { risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' })[];
}

export interface StructuredNoteData {
  meeting_title: string;
  meeting_purpose: string;
  workstream_notes: WorkstreamNote[];
}

export interface RiskAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface UnassignedTask {
  task: string;
  suggested_department?: string;
}

export interface CriticalReview {
  gaps_missing_topics: EmphasisedText[];
  risk_assessment: RiskAssessment[];
  unassigned_ambiguous_tasks: UnassignedTask[];
}

export interface AgentResponse {
  markdown: string;
  next_steps: NextStep[];
  coach_insights?: CoachInsights;
  suggested_questions?: string[];
  structured_data?: StructuredNoteData;  // Raw structured JSON for modern UI rendering
  executive_summary?: string[];  // 3-5 concise bullet points for at-a-glance overview
  critical_review?: CriticalReview;  // Critical lens analysis (when critical_lens=true)
}

export interface Controls {
  focus_department: string[];  // Array of department names from Graph API (e.g., ["Experience Design", "Global Technology"])
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
  groupingMode: GroupingMode;  // How to organize workstream notes: by topic/workstream (default) or by content type
  interrogation_mode?: boolean;
  user_question?: string;
}

export interface FormState {
  title: string;
  agenda: string;
  transcript: string;
  transcriptSource: 'manual' | 'imported';  // Track if transcript was imported or manually entered
  importedMeetingName?: string;              // Meeting name for context display
  importedMeetingDate?: Date;                // Meeting date for context display
  userNotes?: string;  // User-provided additional notes/context
}

export interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// API Configuration for dual agent architecture
export interface ApiConfig {
  hostname: string;
  clientId: string;
  clientSecret: string;
  notesAgentId: string;          // Meeting Notes Generation Agent
  interrogationAgentId: string;  // Interrogation Q&A Agent
}

export interface AuthToken {
    accessToken: string;
    expiresAt: number;
}

export interface Payload {
    meeting_title: string;
    agenda: string[];
    transcript: string;
    user_notes?: string;  // Optional user-provided additional notes/context
    participants?: Participant[];  // NEW: Optional participant context for AI agent
    controls: Controls;
}
export interface InterrogationResponse {
  question: string;
  answer: string;
  emphasis?: EmphasisMarker[];  // Emphasis markers for the answer text
  not_in_transcript: boolean;
  follow_up_suggestions: string[];
}

export interface ChatMessage {
  question: string;
  answer?: string;
  emphasis?: EmphasisMarker[];  // Emphasis markers for the answer text
  not_in_transcript?: boolean;
  follow_up_suggestions?: string[];
  isError?: boolean;
}

// Participant extraction and matching types
export interface ExtractedParticipant {
  rawText: string;           // Original text from transcript (e.g., "Bustos, Luis (LDN-MOM)")
  parsedName?: string;       // Parsed display name (e.g., "Luis Bustos")
  email?: string;            // Extracted email if present
  source: 'transcript-name' | 'transcript-email';
  isExternal?: boolean;      // True if external email (not @momentumww.com)
}

export interface Participant {
  id: string;                // Unique ID for React keys
  extractedText: string;     // Original text from transcript
  matched: boolean;          // Successfully matched to Graph API
  matchConfidence?: 'high' | 'medium' | 'low';
  isExternal?: boolean;      // True if external participant
  participantType?: 'internal' | 'external' | 'unknown';  // User-defined type for unmatched

  // Graph API data (if matched) OR external participant data
  graphId?: string;          // Graph API user ID for presence lookup
  displayName?: string;
  jobTitle?: string;
  department?: string;       // Full department name (e.g., "Global Technology", "Experience Design")
  companyName?: string;
  officeLocation?: string;
  email?: string;
  photoUrl?: string;

  // Presence info (from Graph API)
  presence?: PresenceData;

  // CSV import data & Attendance tracking
  acceptanceStatus?: 'accepted' | 'declined' | 'tentative' | 'noResponse' | 'organizer';
  attendanceType?: 'required' | 'optional';
  attended?: boolean;  // True if actually attended (from attendance report)
  attendanceDurationMinutes?: number;  // How long they attended (from attendance report)
  source?: 'transcript' | 'csv' | 'manual' | 'emailList' | 'meeting';

  // Speaker identification (from transcript analysis)
  spokeInMeeting?: boolean;  // True if speaker name found in VTT transcript
  speakerMentionCount?: number;  // How many times they spoke in transcript (optional)

  // UI state
  isSearching?: boolean;
  searchError?: string;
}

export interface PresenceData {
  availability: 'Available' | 'AvailableIdle' | 'Away' | 'BeRightBack' | 'Busy' | 'BusyIdle' | 'DoNotDisturb' | 'Offline' | 'PresenceUnknown';
  activity?: string;
  lastUpdated?: number;      // Timestamp for cache invalidation
}

export interface CSVParticipant {
  name: string;              // Full name from CSV (e.g., "Bustos, Luis (WW-MOM)")
  email: string;
  acceptanceStatus: 'accepted' | 'declined' | 'tentative' | 'noResponse';
  attendanceType: 'required' | 'optional';
}

export type ParticipantInputMethod = 'transcript' | 'emailList' | 'csv';
