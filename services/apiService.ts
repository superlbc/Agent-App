// NOTE: This service handles communication with the custom Interact API ("AI Console").
import { Payload, AgentResponse, ApiConfig, AuthToken, FormState, InterrogationResponse } from '../types.ts';
import i18n from '../utils/i18n';
import { buildParticipantContext } from '../utils/participantContext';

const getAuthToken = async (config: ApiConfig, signal?: AbortSignal): Promise<string> => {
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
        signal, // Add AbortSignal support
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
    const { meeting_title, agenda, transcript, user_notes, participants, controls } = payload;

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

    // Add user notes if provided
    // These are additional context/instructions from the user to guide the AI
    if (user_notes && user_notes.trim().length > 0) {
        promptParts.push(`User Notes:`);
        promptParts.push(user_notes.trim());
        promptParts.push('');
        console.log(`📝 Including user notes in agent context (${user_notes.trim().split(/\s+/).length} words)`);
    }

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


export const generateNotes = async (payload: Payload, apiConfig: ApiConfig, signal?: AbortSignal): Promise<AgentResponse> => {
    if (!apiConfig.notesAgentId) {
        throw new Error('Meeting Notes Agent ID is missing from config.');
    }

    try {
        const accessToken = await getAuthToken(apiConfig, signal);

        // Always use relative path to leverage proxy (Vite in dev, nginx in production).
        const baseUrl = '';
        const agentUrl = `${baseUrl}/api/chat-ai/v1/bots/${apiConfig.notesAgentId}/messages`;
        const prompt = constructPrompt(payload);

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Authorization', `Bearer ${accessToken}`);

        console.log('🚀 ========== SENDING TO AGENT ==========');
        console.log('🎯 Agent URL:', agentUrl);
        console.log('📝 Prompt length:', prompt.length, 'characters');
        console.log('📋 Prompt preview (first 500 chars):\n', prompt.substring(0, 500));

        const response = await fetch(agentUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ message: prompt }),
            signal, // Add AbortSignal support
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Agent API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
        }

        const responseData = await response.json();

        console.log('📥 ========== RAW RESPONSE FROM AGENT ==========');
        console.log('📦 Response object keys:', Object.keys(responseData));
        console.log('💬 Message type:', typeof responseData.message);
        console.log('💬 Message length:', responseData.message?.length || 0, 'characters');

        if (typeof responseData.message !== 'string') {
          throw new Error(`Expected agent response 'message' to be a string, but got ${typeof responseData.message}.`);
        }

        const raw = String(responseData.message);
        console.log('📄 Raw message (first 1000 chars):\n', raw.substring(0, 1000));
        console.log('📄 Raw message (last 500 chars):\n', raw.substring(Math.max(0, raw.length - 500)));
        let agentResponse: AgentResponse;

        // FIRST: Check if the response is a fenced JSON block (```json {...} ```)
        // Extract the JSON content if it's fenced
        let trimmedRaw = raw.trim();
        const fencedMatch = trimmedRaw.match(/^```(?:json|jsonc|json5)?\s*([\s\S]+?)\s*```$/);
        if (fencedMatch && fencedMatch[1]) {
            console.log('🔓 Detected fenced JSON block, extracting content...');
            trimmedRaw = fencedMatch[1].trim();
        }
        // NOW: Try to parse the (possibly unwrapped) JSON
        console.log('🔍 Checking if response is JSON-only format...');
        console.log('   Starts with {:', trimmedRaw.startsWith('{'));
        console.log('   Ends with }:', trimmedRaw.endsWith('}'));

        if (trimmedRaw.startsWith('{') && trimmedRaw.endsWith('}')) {
            try {
                const parsedJson = JSON.parse(trimmedRaw);
                console.log('✅ Successfully parsed as JSON');
                console.log('   Has "markdown" field:', 'markdown' in parsedJson);
                console.log('   Has "meeting_title" field (old format):', 'meeting_title' in parsedJson);
                console.log('   Has "workstream_notes" field (old format):', 'workstream_notes' in parsedJson);
                console.log('   Has "next_steps" field:', 'next_steps' in parsedJson);

                // Check if it's NEW format with markdown field
                if (parsedJson && typeof parsedJson === 'object' && 'markdown' in parsedJson) {
                    console.log('✅ ========== DETECTED NEW JSON-ONLY FORMAT ==========');
                    agentResponse = {
                        markdown: parsedJson.markdown || '',
                        next_steps: parsedJson.next_steps || [],
                        coach_insights: parsedJson.coach_insights || undefined,
                        suggested_questions: parsedJson.suggested_questions || [],
                    };
                    console.log('📊 Parsed Response:');
                    console.log('   Markdown length:', agentResponse.markdown?.length || 0);
                    console.log('   Markdown preview (first 200 chars):', agentResponse.markdown?.substring(0, 200));
                    console.log('   Next steps count:', agentResponse.next_steps?.length || 0);
                    console.log('   Has coach insights:', !!agentResponse.coach_insights);
                    console.log('   Suggested questions count:', agentResponse.suggested_questions?.length || 0);
                    return agentResponse;
                }

                // Check if it's NEW STRUCTURED format with meeting_title and workstream_notes
                if (parsedJson && typeof parsedJson === 'object' && 'meeting_title' in parsedJson && 'workstream_notes' in parsedJson) {
                    console.log('🔄 ========== DETECTED NEW STRUCTURED JSON FORMAT - CONVERTING TO MARKDOWN ==========');

                    // Convert structured JSON format to markdown for rendering
                    let markdown = '';

                    // Title
                    if (parsedJson.meeting_title) {
                        markdown += `# ${parsedJson.meeting_title}\n\n`;
                    }

                    // Purpose
                    if (parsedJson.meeting_purpose) {
                        markdown += `**Meeting Purpose:** ${parsedJson.meeting_purpose}\n\n`;
                    }

                    // Workstream notes
                    if (parsedJson.workstream_notes && Array.isArray(parsedJson.workstream_notes)) {
                        markdown += `---\n\n`;

                        parsedJson.workstream_notes.forEach((workstream: any) => {
                            if (workstream.workstream_name) {
                                markdown += `## 🔸 ${workstream.workstream_name}\n\n`;
                            }

                            // Key discussion points
                            if (workstream.key_discussion_points && workstream.key_discussion_points.length > 0) {
                                markdown += `### 🎯 KEY DISCUSSION POINTS\n\n`;
                                workstream.key_discussion_points.forEach((point: any) => {
                                    // Ensure we extract the text string, not the entire object
                                    const textContent = typeof point === 'string' ? point : (point.text || '');
                                    if (textContent) {
                                        markdown += `- ${String(textContent)}\n`;
                                    }
                                });
                                markdown += `\n`;
                            }

                            // Decisions made
                            if (workstream.decisions_made && workstream.decisions_made.length > 0) {
                                markdown += `### ✅ DECISIONS MADE\n\n`;
                                workstream.decisions_made.forEach((decision: any) => {
                                    const textContent = typeof decision === 'string' ? decision : (decision.text || '');
                                    if (textContent) {
                                        markdown += `- ${String(textContent)}\n`;
                                    }
                                });
                                markdown += `\n`;
                            }

                            // Risks or open questions
                            if (workstream.risks_or_open_questions && workstream.risks_or_open_questions.length > 0) {
                                markdown += `### ❓ RISKS OR OPEN QUESTIONS\n\n`;
                                workstream.risks_or_open_questions.forEach((risk: any) => {
                                    const textContent = typeof risk === 'string' ? risk : (risk.text || '');
                                    if (textContent) {
                                        markdown += `- ${String(textContent)}\n`;
                                    }
                                });
                                markdown += `\n`;
                            }
                        });
                    }

                    // Add NEXT STEPS header so the NextStepsTable renders
                    if (parsedJson.next_steps && parsedJson.next_steps.length > 0) {
                        markdown += `\n---\n\n## 🔷 NEXT STEPS\n\n`;
                        markdown += `_(Action items table will appear below)_\n\n`;
                    }

                    // Ensure markdown is a valid string
                    const validMarkdown = typeof markdown === 'string' ? markdown : '';

                    // Filter suggested_questions to ensure they're all strings (no objects)
                    const validSuggestedQuestions = Array.isArray(parsedJson.suggested_questions)
                        ? parsedJson.suggested_questions.filter((q: any) => typeof q === 'string')
                        : [];

                    // CRITICAL FIX: Convert coach_insights arrays from {text, emphasis} objects to plain strings
                    let processedCoachInsights = parsedJson.coach_insights;
                    if (processedCoachInsights) {
                        const extractTextFromArray = (arr: any[]) => {
                            if (!Array.isArray(arr)) return arr;
                            return arr.map((item: any) => {
                                if (typeof item === 'string') return item;
                                if (item && typeof item === 'object' && 'text' in item) {
                                    return String(item.text); // Extract .text field from {text, emphasis} objects
                                }
                                return String(item);
                            });
                        };

                        processedCoachInsights = {
                            ...processedCoachInsights,
                            strengths: extractTextFromArray(processedCoachInsights.strengths || []),
                            improvements: extractTextFromArray(processedCoachInsights.improvements || []),
                            facilitation_tips: extractTextFromArray(processedCoachInsights.facilitation_tips || []),
                        };

                        console.log('🔄 Converted coach_insights from structured objects to strings');
                    }

                    agentResponse = {
                        markdown: validMarkdown,
                        next_steps: Array.isArray(parsedJson.next_steps) ? parsedJson.next_steps : [],
                        coach_insights: processedCoachInsights,
                        suggested_questions: validSuggestedQuestions,
                    };

                    console.log('✅ Successfully converted structured JSON to markdown for rendering!');
                    console.log('   Markdown length:', agentResponse.markdown?.length || 0);
                    console.log('   Markdown type:', typeof agentResponse.markdown);
                    console.log('   Markdown preview (first 300 chars):', agentResponse.markdown?.substring(0, 300));
                    console.log('   Workstreams processed:', parsedJson.workstream_notes?.length || 0);
                    console.log('   Next steps count:', agentResponse.next_steps?.length || 0);
                    console.log('   Next steps are array:', Array.isArray(agentResponse.next_steps));
                    console.log('   Suggested questions count:', agentResponse.suggested_questions?.length || 0);
                    console.log('   Suggested questions are array:', Array.isArray(agentResponse.suggested_questions));
                    console.log('   Suggested questions filtered from:', parsedJson.suggested_questions?.length || 0);

                    // Critical: Verify agentResponse structure before returning
                    if (typeof agentResponse.markdown !== 'string') {
                        console.error('❌ CRITICAL: markdown is not a string!', typeof agentResponse.markdown);
                        throw new Error('Markdown conversion failed - result is not a string');
                    }

                    return agentResponse;
                }

                console.log('⚠️ JSON parsed but unrecognized format, trying legacy parsing');

            } catch (e) {
                // Not valid JSON, continue with legacy parsing
                console.log('⚠️ Response looks like JSON but failed to parse:', e);
                console.log('   Trying legacy format...');
            }
        } else {
            console.log('❌ Not JSON-only format (doesn\'t start/end with braces), trying legacy format');
        }

        // LEGACY: Try to find a properly fenced JSON block at the end (markdown + JSON format)
        console.log('🔍 Trying legacy format parsing...');
        const fencedJsonRegex = /```(?:json|jsonc|json5)?\s*({[\s\S]+?})\s*```\s*$/;
        let match = raw.match(fencedJsonRegex);
        console.log('   Fenced JSON block found:', !!match);

        // If not found, try to find an unfenced JSON object at the end.
        if (!match) {
            console.log('   Trying unfenced JSON detection...');
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
                const jsonBlockIndex = raw.lastIndexOf(match[0]);
                let markdownContent = raw.substring(0, jsonBlockIndex).trim();

                // FIX: If markdown is empty but JSON has a markdown field, use it
                if (!markdownContent && parsedJson.markdown) {
                    console.log('⚠️ Empty markdown extracted, using markdown field from JSON');
                    markdownContent = parsedJson.markdown;
                }

                console.log('📝 Parsed legacy format - Markdown length:', markdownContent.length, 'Actions:', parsedJson.next_steps?.length || 0);

                agentResponse = {
                    markdown: markdownContent,
                    next_steps: parsedJson.next_steps || [],
                    coach_insights: parsedJson.coach_insights || undefined,
                    suggested_questions: parsedJson.suggested_questions || [],
                };
            } catch (e) {
                console.warn("Found a JSON-like block but failed to parse it. Stripping it from the markdown view.", e);
                const markdownContent = raw.substring(0, raw.lastIndexOf(match[0])).trim();
                agentResponse = {
                    markdown: markdownContent || raw, // Fallback to full raw if empty
                    next_steps: [],
                    coach_insights: undefined,
                    suggested_questions: [],
                };
            }
        } else {
            // No JSON block found - treat entire response as markdown
            console.log('⚠️ No JSON block found, treating entire response as markdown');
            agentResponse = {
                markdown: raw,
                next_steps: [],
                coach_insights: undefined,
                suggested_questions: [],
            };
        }

        console.log('🎉 ========== FINAL PARSED RESPONSE ==========');
        console.log('📊 AgentResponse object:');
        console.log('   markdown:', agentResponse.markdown ? `${agentResponse.markdown.length} chars` : 'EMPTY OR UNDEFINED');
        console.log('   markdown preview:', agentResponse.markdown?.substring(0, 200));
        console.log('   next_steps:', agentResponse.next_steps?.length || 0, 'items');
        console.log('   coach_insights:', agentResponse.coach_insights ? 'present' : 'absent');
        console.log('   suggested_questions:', agentResponse.suggested_questions?.length || 0, 'items');
        console.log('===========================================');

        return agentResponse;

    } catch (error) {
        console.error('Error in generateNotes:', error);

        // Handle AbortError specifically
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('GENERATION_CANCELLED');
        }

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
    if (!apiConfig.interrogationAgentId) {
        throw new Error('Interrogation Agent ID is missing from config.');
    }

    try {
        const accessToken = await getAuthToken(apiConfig);

        // Always use relative path to leverage proxy (Vite in dev, nginx in production).
        const baseUrl = '';
        const agentUrl = `${baseUrl}/api/chat-ai/v1/bots/${apiConfig.interrogationAgentId}/messages`;

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