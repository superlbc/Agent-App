// NOTE: This service handles communication with the custom Interact API ("AI Console").
import { Payload, AgentResponse, ApiConfig, AuthToken, FormState, InterrogationResponse } from '../types.ts';
import i18n from '../utils/i18n';
import { buildParticipantContext } from '../utils/participantContext';

const getAuthToken = async (config: ApiConfig): Promise<string> => {
    if (!config.clientId || !config.clientSecret) {
        throw new Error('Client ID or Client Secret is missing from config.');
    }

    const tokenString = localStorage.getItem('authToken');
    if (tokenString) {
        const token: AuthToken = JSON.parse(tokenString);
        if (token.expiresAt > Date.now()) {
            return token.accessToken;
        }
    }
    
    // Always use relative path to leverage proxy (Vite in dev, nginx in production).
    // This avoids CORS issues by keeping requests on the same origin.
    // Note: Direct hostname usage is not supported - always use proxy.
    const baseUrl = '';
    const tokenUrl = `${baseUrl}/api/token`;
    
    // Debugging log to confirm the URL being used
    console.log('tokenUrl →', tokenUrl);

    const credentials = btoa(`${String(config.clientId).trim()}:${String(config.clientSecret).trim()}`);

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });


    if (!response.ok) {
        const text = await response.text().catch(() => '');
        const www = response.headers.get('www-authenticate') || '';
        localStorage.removeItem('authToken');
        throw new Error(`Failed to authenticate: ${response.status} ${response.statusText}. ${www ? `WWW-Authenticate: ${www}. ` : ''}Details: ${text}`);
    }

    const data = await response.json();
    const newToken: AuthToken = {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    localStorage.setItem('authToken', JSON.stringify(newToken));
    return newToken.accessToken;
};

/**
 * Constructs a single prompt string from the structured payload,
 * including all meeting details and control settings for the agent.
 */
const constructPrompt = (payload: Payload): string => {
    const { meeting_title, agenda, transcript, participants, controls } = payload;

    // Get current language from i18n (en, es, or ja)
    const currentLanguage = i18n.language || 'en';

    const promptParts = [
        `<<<APP_MODE>>>`,
        `Meeting Title: ${meeting_title}`,
        ``,
    ];

    if (agenda && agenda.length > 0) {
      promptParts.push('Agenda:');
      promptParts.push(...agenda);
      promptParts.push('');
    }

    promptParts.push(
        `Transcript:`,
        transcript,
        ``,
    );

    // NEW: Add participant context if available
    // This provides the AI agent with structured participant data for:
    // - Accurate department assignment in Next Steps
    // - Speaker identification and matching
    // - Participation metrics (if attendance data present)
    // - Silent stakeholder identification
    if (participants && participants.length > 0) {
        const participantContext = buildParticipantContext(participants);
        if (participantContext) {
            promptParts.push(participantContext);
            promptParts.push('');
            console.log(`📊 Including ${participants.length} participants in agent context`);
        }
    }

    promptParts.push(`Controls:`);

    const controlEntries = Object.entries(controls)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => {
            if (key === 'focus_department' && Array.isArray(value)) {
                return value.length > 0 ? `${key}: ${value.join(',')}` : null;
            }
            return `${key}: ${value}`;
        })
        .filter(Boolean) as string[];

    // Add output_language control to tell agent what language to generate in
    controlEntries.push(`output_language: ${currentLanguage}`);

    promptParts.push(...controlEntries);

    console.log(`📝 Sending request to agent with output_language: ${currentLanguage}`);

    return promptParts.join('\n');
};


export const generateNotes = async (payload: Payload, apiConfig: ApiConfig): Promise<AgentResponse> => {
    if (!apiConfig.botId) {
        throw new Error('Bot ID is missing from config.');
    }
    
    try {
        const accessToken = await getAuthToken(apiConfig);
        
        // Always use relative path to leverage proxy (Vite in dev, nginx in production).
        const baseUrl = '';
        const agentUrl = `${baseUrl}/api/chat-ai/v1/bots/${apiConfig.botId}/messages`;
        const prompt = constructPrompt(payload);

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Authorization', `Bearer ${accessToken}`);

        const response = await fetch(agentUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ message: prompt }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Agent API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
        }
        
        const responseData = await response.json();

        if (typeof responseData.message !== 'string') {
          throw new Error(`Expected agent response 'message' to be a string, but got ${typeof responseData.message}.`);
        }
        
        const raw = String(responseData.message);
        let agentResponse: AgentResponse;
        
        // First, try to find a properly fenced JSON block.
        const fencedJsonRegex = /```(?:json|jsonc|json5)?\s*({[\s\S]+?})\s*```\s*$/;
        let match = raw.match(fencedJsonRegex);
        
        // If not found, try to find an unfenced JSON object at the end.
        if (!match) {
            const nextStepsKeyIndex = raw.lastIndexOf('"next_steps":');
            if (nextStepsKeyIndex > -1) {
                const jsonStartIndex = raw.lastIndexOf('{', nextStepsKeyIndex);
                if (jsonStartIndex > -1) {
                    const jsonEndIndex = raw.lastIndexOf('}');
                    if (jsonEndIndex > jsonStartIndex) {
                        const potentialJsonString = raw.substring(jsonStartIndex, jsonEndIndex + 1);
                        try {
                            const parsed = JSON.parse(potentialJsonString);
                            if (parsed && typeof parsed === 'object' && 'next_steps' in parsed) {
                                // It's valid and contains our key. Treat it as the match.
                                match = [potentialJsonString, potentialJsonString];
                            }
                        } catch (e) {
                            match = null;
                        }
                    }
                }
            }
        }
        
        if (match && match[1]) {
            try {
                const jsonString = match[1].trim();
                const parsedJson = JSON.parse(jsonString);
                
                // The markdown is the raw response with the entire matched block removed.
                const markdownContent = raw.substring(0, raw.lastIndexOf(match[0])).trim();

                agentResponse = {
                    markdown: markdownContent,
                    next_steps: parsedJson.next_steps || [],
                    coach_insights: parsedJson.coach_insights || undefined,
                    suggested_questions: parsedJson.suggested_questions || [],
                };
            } catch (e) {
                console.warn("Found a JSON-like block but failed to parse it. Stripping it from the markdown view.", e, 'Raw content:', raw);
                const markdownContent = raw.substring(0, raw.lastIndexOf(match[0])).trim();
                agentResponse = {
                    markdown: markdownContent,
                    next_steps: [],
                    coach_insights: undefined,
                    suggested_questions: [],
                };
            }
        } else {
            // No JSON block found
            agentResponse = {
                markdown: raw,
                next_steps: [], 
                coach_insights: undefined,
                suggested_questions: [],
            };
        }

        return agentResponse;

    } catch (error) {
        console.error('Error in generateNotes:', error);

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error("Network request failed due to a browser security policy (CORS). This is not an application bug. Please ask the API administrator to add your origin to the server's CORS allowlist.");
        }
        
        if (error instanceof Error && error.message.includes('authenticate')) {
            localStorage.removeItem('authToken');
        }
        throw error;
    }
};

export const interrogateTranscript = async (
    formState: FormState,
    question: string,
    apiConfig: ApiConfig
): Promise<InterrogationResponse> => {
    if (!apiConfig.botId) {
        throw new Error('Bot ID is missing from config.');
    }

    try {
        const accessToken = await getAuthToken(apiConfig);

        // Always use relative path to leverage proxy (Vite in dev, nginx in production).
        const baseUrl = '';
        const agentUrl = `${baseUrl}/api/chat-ai/v1/bots/${apiConfig.botId}/messages`;

        const payload: Payload = {
            meeting_title: formState.title,
            agenda: formState.agenda.split('\n').filter(line => line.trim() !== ''),
            transcript: formState.transcript,
            controls: {
                // Default controls to ensure agent compatibility
                focus_department: [],
                view: 'full',
                critical_lens: false,
                audience: 'cross-functional',
                tone: 'professional',
                redact: false,
                status_view: 'embedded',
                meeting_date: new Date().toISOString().split('T')[0],
                rag_mode: 'rag',
                use_icons: false,
                bold_important_words: true,
                meetingPreset: 'custom',
                meeting_coach: false,
                coaching_style: 'gentle',
                // Interrogation specific controls
                interrogation_mode: true,
                user_question: question,
            }
        };

        const prompt = constructPrompt(payload);

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Authorization', `Bearer ${accessToken}`);

        const response = await fetch(agentUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ message: prompt }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Agent API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
        }

        const responseData = await response.json();

        if (typeof responseData.message !== 'string') {
            throw new Error(`Expected agent response 'message' to be a string, but got ${typeof responseData.message}.`);
        }
        
        const rawResponse = responseData.message;
        const fencedJsonRegex = /```json\s*({[\s\S]+?})\s*```/;
        const match = rawResponse.match(fencedJsonRegex);

        if (!match || !match[1]) {
            console.warn("Interrogation response was not a fenced JSON block. Content:", rawResponse);
            // Return a user-friendly error response that fits the data structure
            return {
                question: question,
                answer: "The agent returned an invalid response format. Please try again or rephrase your question.",
                not_in_transcript: true,
                follow_up_suggestions: []
            };
        }

        try {
            const parsedJson = JSON.parse(match[1]);
            if (
                typeof parsedJson.question === 'string' &&
                typeof parsedJson.answer === 'string' &&
                typeof parsedJson.not_in_transcript === 'boolean' &&
                Array.isArray(parsedJson.follow_up_suggestions)
            ) {
                return parsedJson as InterrogationResponse;
            } else {
                throw new Error("Parsed JSON from agent is missing required fields.");
            }
        } catch (error) {
            console.error("Failed to parse JSON from interrogation response:", error);
            throw new Error("The agent returned a malformed JSON response.");
        }

    } catch (error) {
        console.error('Error in interrogateTranscript:', error);

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error("Network request failed due to a browser security policy (CORS). This is not an application bug. Please ask the API administrator to add your origin to the server's CORS allowlist.");
        }

        if (error instanceof Error && error.message.includes('authenticate')) {
            localStorage.removeItem('authToken');
        }
        throw error;
    }
};