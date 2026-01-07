// ============================================================================
// MOMENTUM KNOWLEDGE ASSISTANT - TYPE DEFINITIONS
// ============================================================================
// AI-powered knowledge base for Momentum employees

// ============================================================================
// INFRASTRUCTURE TYPES (Preserved from original app)
// ============================================================================

/**
 * Microsoft Graph API user data
 * Used for user profile enrichment and authentication
 */
export interface GraphData {
  id?: string;               // Graph API user ID
  displayName?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  officeLocation?: string;
  mail?: string;
  photoUrl?: string;
}

/**
 * Toast notification state
 * Used for success/error messages throughout the app
 */
export interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

/**
 * Authentication token management
 * Used for API authentication and token caching
 */
export interface AuthToken {
  accessToken: string;
  expiresAt: number;
}

/**
 * API Configuration
 * Used for backend service integration and AI agent communication
 */
export interface ApiConfig {
  hostname: string;
  clientId: string;
  clientSecret: string;
  notesAgentId?: string;
  interrogationAgentId?: string;
}

/**
 * User/Stakeholder reference
 * Used for tracking participants in chat conversations
 */
export interface Participant {
  id: string;
  displayName?: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  officeLocation?: string;
  photoUrl?: string;
  graphId?: string;
  isExternal?: boolean;
  source?: 'manual' | 'graph' | 'database' | 'csv';
}

// ============================================================================
// AI AGENT TYPES (For legacy meeting notes and interrogation features)
// ============================================================================

/**
 * Emphasis markers for text highlighting
 * Used to highlight important elements in meeting notes
 */
export interface EmphasisMarker {
  type: 'person' | 'date' | 'status' | 'task' | 'department' | 'monetary' | 'deadline' | 'risk' | 'general';
  value: string;  // The exact text to emphasize (client will find position)
}

/**
 * Text with optional emphasis markers
 */
export interface EmphasisedText {
  text: string;
  emphasis?: EmphasisMarker[];
}

/**
 * Workstream notes structure
 */
export interface WorkstreamNote {
  workstream_name: string;
  key_discussion_points?: EmphasisedText[];
  decisions_made?: EmphasisedText[];
  risks_or_open_questions?: (EmphasisedText & { risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' })[];
}

/**
 * Structured note data from AI agent
 */
export interface StructuredNoteData {
  meeting_title: string;
  meeting_purpose: string;
  workstream_notes: WorkstreamNote[];
}

/**
 * Next step/action item
 */
export interface NextStep {
  department: string;
  owner: string;
  task: string;
  due_date: string;
  status: 'NA' | 'GREEN' | 'AMBER' | 'RED';
  status_notes: string;
}

/**
 * Meeting coach metrics
 */
export interface CoachMetrics {
  agenda_coverage_pct: number;
  decision_count: number;
  action_count: number;
  actions_with_owner_pct: number;
  actions_with_due_date_pct: number;
  participants_estimated: number;
  top_speaker_share_pct: number;
}

/**
 * Meeting coach insights
 */
export interface CoachInsights {
  initiative: string;
  style: 'gentle' | 'direct';
  strengths: string[];
  improvements: string[];
  facilitation_tips: string[];
  metrics: CoachMetrics;
  flags: {
    participation_imbalance: boolean;
    many_unassigned_actions: boolean;
    few_decisions: boolean;
    light_agenda_coverage: boolean;
  };
}

/**
 * AI Agent response for meeting notes
 */
export interface AgentResponse {
  markdown: string;
  next_steps: NextStep[];
  coach_insights?: CoachInsights;
  suggested_questions?: string[];
  structured_data?: StructuredNoteData;
  executive_summary?: string[];
}

/**
 * Controls for AI agent processing
 */
export interface Controls {
  focus_department: string[];
  view: 'full' | 'actions-only';
  critical_lens: boolean;
  audience: 'executive' | 'cross-functional' | 'department-specific';
  tone: 'professional' | 'concise' | 'client-ready';
  redact: boolean;
  status_view: string;
  meeting_date: string;
  rag_mode: string;
  use_icons: boolean;
  bold_important_words: boolean;
  meetingPreset: 'client-update' | 'internal-sync' | 'brainstorm' | 'executive-briefing' | 'custom';
  meeting_coach: boolean;
  coaching_style: 'gentle' | 'direct';
  groupingMode: 'by-topic' | 'by-type';
  interrogation_mode?: boolean;
  user_question?: string;
}

/**
 * Form state for meeting input
 */
export interface FormState {
  title: string;
  agenda: string;
  transcript: string;
  transcriptSource: 'manual' | 'imported';
  importedMeetingName?: string;
  importedMeetingDate?: Date;
  userNotes?: string;
}

/**
 * Payload sent to AI agent
 */
export interface Payload {
  meeting_title: string;
  agenda: string[];
  transcript: string;
  user_notes?: string;
  participants?: Participant[];
  controls: Controls;
}

/**
 * Interrogation response from AI agent
 */
export interface InterrogationResponse {
  question: string;
  answer: string;
  emphasis?: EmphasisMarker[];
  not_in_transcript: boolean;
  follow_up_suggestions: string[];
}

/**
 * Critical thinking request
 */
export interface CriticalThinkingRequest {
  line_text: string;
  line_context: string;
  workstream_name: string;
  full_transcript: string;
  meeting_title: string;
  meeting_purpose: string;
}

/**
 * Critical thinking analysis result
 */
export interface CriticalThinkingAnalysis {
  strategic_context?: string;
  alternative_perspectives?: string[];
  probing_questions?: string[];
  risk_analysis?: string;
  connections?: string;
  actionable_insights?: string[];
}

/**
 * Critical thinking response from AI agent
 */
export interface CriticalThinkingResponse {
  line_text: string;
  analysis: CriticalThinkingAnalysis;
  emphasis?: EmphasisMarker[];
}

// ============================================================================
// COPILOT CHATBOT TYPES
// ============================================================================

/**
 * Copilot conversation session
 * Represents a Direct Line conversation with token and metadata
 */
export interface CopilotConversation {
  conversationId: string;
  token: string;
  expiresIn: number; // seconds
  streamUrl?: string;
}

/**
 * Copilot message in our internal format
 * Unified message structure for user and bot messages
 */
export interface CopilotMessage {
  id: string;
  timestamp: Date;
  from: 'user' | 'bot';
  text?: string;
  adaptiveCard?: AdaptiveCard;
  channelData?: any;
}

/**
 * Adaptive Card structure
 * Simplified version supporting text blocks and actions
 */
export interface AdaptiveCard {
  type: 'AdaptiveCard';
  version: string;
  body: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
  actions?: Array<{
    type: string;
    title?: string;
    url?: string;
    [key: string]: any;
  }>;
}

/**
 * Personnel data from chatbot lookup service
 * Used for department context injection into Copilot messages
 */
export interface ChatbotPersonnelData {
  emailAddress: string;
  name: string;
  department: string | null;
  departmentGroup: string | null;
  role: string | null;
  managerName: string | null;
  managerEmail: string | null;
}

/**
 * Cached personnel data with TTL
 * Stored in localStorage with 24-hour expiration
 */
export interface CachedChatbotPersonnelData {
  data: ChatbotPersonnelData;
  timestamp: number;
  version: string;
}
