/**
 * Microsoft Copilot Studio Service
 *
 * Handles communication with Copilot Studio bots via Direct Line API
 * Used for the Momentum Knowledge Base Chatbot
 *
 * Features:
 * - Conversation lifecycle management (create, send, poll)
 * - Message transformation to our internal format
 * - Adaptive Card support
 * - Error handling with user-friendly messages
 * - AbortSignal support for cancellation
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Copilot conversation session
 */
export interface CopilotConversation {
  conversationId: string;
  token: string;
  expiresIn: number; // seconds
  streamUrl?: string;
}

/**
 * Copilot message in our internal format
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
 * Direct Line API activity (raw format)
 */
interface DirectLineActivity {
  type: string;
  id: string;
  timestamp: string;
  from: {
    id: string;
    name?: string;
    role?: string;
  };
  text?: string;
  attachments?: Array<{
    contentType: string;
    content: any;
  }>;
  channelData?: any;
}

/**
 * Direct Line API response when polling activities
 */
interface DirectLineActivitiesResponse {
  activities: DirectLineActivity[];
  watermark: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DIRECT_LINE_BASE_URL = 'https://directline.botframework.com/v3/directline';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

/**
 * Create a new Copilot conversation
 *
 * @param copilotToken - Direct Line token from environment/config
 * @param signal - Optional AbortSignal for cancellation
 * @returns Conversation session with conversationId and token
 */
export const createConversation = async (
  copilotToken: string,
  signal?: AbortSignal
): Promise<CopilotConversation | null> => {
  if (!copilotToken || copilotToken.startsWith('YOUR_')) {
    console.warn('[CopilotService] Copilot token not configured. Skipping conversation creation.');
    return null;
  }

  try {
    console.log('[CopilotService] Creating new conversation...');

    const response = await fetch(`${DIRECT_LINE_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${copilotToken}`,
        'Content-Type': 'application/json',
      },
      signal: signal || AbortSignal.timeout(DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Failed to create conversation: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json();

    const conversation: CopilotConversation = {
      conversationId: data.conversationId,
      token: data.token,
      expiresIn: data.expires_in || 1800, // Default 30 minutes
      streamUrl: data.streamUrl,
    };

    console.log(
      `[CopilotService] ✅ Conversation created: ${conversation.conversationId} (expires in ${conversation.expiresIn}s)`
    );

    return conversation;

  } catch (error) {
    console.error('[CopilotService] Failed to create conversation:', error);

    // Handle AbortError specifically
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('CONVERSATION_CREATION_CANCELLED');
    }

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Invalid Copilot token. Please check your configuration.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
    }

    return null;
  }
};

// ============================================================================
// MESSAGE SENDING
// ============================================================================

/**
 * Send a message to the Copilot bot with department context
 *
 * @param conversationId - Conversation ID from createConversation
 * @param token - Direct Line token
 * @param messageText - User's message text
 * @param departmentContext - User's department for context injection
 * @param signal - Optional AbortSignal for cancellation
 * @returns True if message sent successfully, false otherwise
 */
export const sendMessage = async (
  conversationId: string,
  token: string,
  messageText: string,
  departmentContext?: string,
  signal?: AbortSignal
): Promise<boolean> => {
  if (!conversationId || !token || !messageText) {
    console.warn('[CopilotService] Missing required parameters for sendMessage');
    return false;
  }

  try {
    console.log('[CopilotService] Sending message:', messageText.substring(0, 100));

    // Inject department context into message if available
    let enrichedMessage = messageText;
    if (departmentContext && departmentContext !== 'General') {
      enrichedMessage = `[Department: ${departmentContext}] ${messageText}`;
      console.log(`[CopilotService] Including department context: ${departmentContext}`);
    }

    const activity = {
      type: 'message',
      from: {
        id: 'user',
        name: 'User',
      },
      text: enrichedMessage,
      locale: 'en-US',
    };

    const response = await fetch(
      `${DIRECT_LINE_BASE_URL}/conversations/${conversationId}/activities`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
        signal: signal || AbortSignal.timeout(DEFAULT_TIMEOUT),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Failed to send message: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const result = await response.json();
    console.log(`[CopilotService] ✅ Message sent. Activity ID: ${result.id}`);

    return true;

  } catch (error) {
    console.error('[CopilotService] Failed to send message:', error);

    // Handle AbortError specifically
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('MESSAGE_SEND_CANCELLED');
    }

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Conversation expired. Please start a new conversation.');
      }
      if (error.message.includes('404')) {
        throw new Error('Conversation not found. Please start a new conversation.');
      }
    }

    return false;
  }
};

// ============================================================================
// MESSAGE POLLING
// ============================================================================

/**
 * Poll for new bot responses
 *
 * Direct Line API uses polling to retrieve bot responses.
 * The watermark parameter tracks which messages have been retrieved.
 *
 * @param conversationId - Conversation ID
 * @param token - Direct Line token
 * @param watermark - Last watermark (use empty string for first poll)
 * @param signal - Optional AbortSignal for cancellation
 * @returns Array of new messages and updated watermark
 */
export const pollActivities = async (
  conversationId: string,
  token: string,
  watermark: string = '',
  signal?: AbortSignal
): Promise<{ messages: CopilotMessage[]; watermark: string } | null> => {
  if (!conversationId || !token) {
    console.warn('[CopilotService] Missing required parameters for pollActivities');
    return null;
  }

  try {
    const url = watermark
      ? `${DIRECT_LINE_BASE_URL}/conversations/${conversationId}/activities?watermark=${watermark}`
      : `${DIRECT_LINE_BASE_URL}/conversations/${conversationId}/activities`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: signal || AbortSignal.timeout(DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Failed to poll activities: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data: DirectLineActivitiesResponse = await response.json();

    // Transform Direct Line activities to our message format
    const messages = transformActivitiesToMessages(data.activities);

    if (messages.length > 0) {
      console.log(`[CopilotService] ✅ Polled ${messages.length} new messages`);
    }

    return {
      messages,
      watermark: data.watermark,
    };

  } catch (error) {
    console.error('[CopilotService] Failed to poll activities:', error);

    // Handle AbortError specifically
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('POLL_CANCELLED');
    }

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Conversation expired. Please start a new conversation.');
      }
      if (error.message.includes('404')) {
        throw new Error('Conversation not found. Please start a new conversation.');
      }
    }

    return null;
  }
};

// ============================================================================
// MESSAGE TRANSFORMATION
// ============================================================================

/**
 * Transform Direct Line API activities to our message format
 *
 * @param activities - Raw Direct Line activities
 * @returns Array of transformed messages
 */
const transformActivitiesToMessages = (activities: DirectLineActivity[]): CopilotMessage[] => {
  return activities
    .filter(activity => {
      // Only process message-type activities from the bot
      return activity.type === 'message' && activity.from.role === 'bot';
    })
    .map(activity => {
      const message: CopilotMessage = {
        id: activity.id,
        timestamp: new Date(activity.timestamp),
        from: 'bot',
        text: activity.text,
        channelData: activity.channelData,
      };

      // Extract Adaptive Card if present
      if (activity.attachments && activity.attachments.length > 0) {
        const adaptiveCardAttachment = activity.attachments.find(
          att => att.contentType === 'application/vnd.microsoft.card.adaptive'
        );

        if (adaptiveCardAttachment) {
          message.adaptiveCard = adaptiveCardAttachment.content as AdaptiveCard;
          console.log('[CopilotService] Extracted Adaptive Card from attachment');
        }
      }

      return message;
    });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract plain text from Adaptive Card
 * Useful for displaying card content in non-card-supporting UIs
 *
 * @param card - Adaptive Card object
 * @returns Extracted plain text
 */
export const extractTextFromAdaptiveCard = (card: AdaptiveCard): string => {
  if (!card || !card.body) {
    return '';
  }

  return card.body
    .filter(block => block.type === 'TextBlock' && block.text)
    .map(block => block.text)
    .join('\n\n');
};

/**
 * Validate conversation is still active
 * Checks if conversation has expired based on expiresIn
 *
 * @param conversation - Conversation object
 * @param createdAt - When conversation was created
 * @returns True if conversation is still valid
 */
export const isConversationValid = (
  conversation: CopilotConversation,
  createdAt: Date
): boolean => {
  const now = Date.now();
  const expirationTime = createdAt.getTime() + (conversation.expiresIn * 1000);
  return now < expirationTime;
};
