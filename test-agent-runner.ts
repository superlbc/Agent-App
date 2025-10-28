/**
 * Test Agent Runner
 *
 * This script tests the new agent system prompt by calling the test agent
 * in both normal mode (minutes generation) and interrogation mode (Q&A).
 *
 * Usage: node --loader ts-node/esm test-agent-runner.ts
 * Or with tsx: npx tsx test-agent-runner.ts
 */

import { Payload, Controls, InterrogationResponse } from './types';

// Test Agent Configuration
const TEST_AGENT_ID = 'b8460071-daee-4820-8198-5224fdc99e45';
const API_BASE_URL = 'https://interact.interpublic.com';

// Sample Meeting Data (from constants.ts)
const SAMPLE_MEETING = {
  title: "ACL Weekly Team Status – 8/26",
  agenda: ["ACL Nights Show", "Main Footprint", "Side Stage"],
  transcript: "Alright team, let's kick off. Main footprint status? John reports we are green on talent booking. Let's talk about the side stage. We need to finalize the audio vendor by EOD Friday. Casey to mock up blanket and hat designs, due date is 2025-09-02. This is for the ACL Nights show. Sarah, can you please coordinate with the city on permits? Make sure to check with legal@example.com before signing anything. Their number is (555) 123-4567. We need a decision on the catering options for the VIP area. That's a key risk if we don't lock it down. Bob will own the decision on catering.",
};

// Helper to get auth token
async function getAuthToken(clientId: string, clientSecret: string): Promise<string> {
  const tokenUrl = `${API_BASE_URL}/api/token`;
  const credentials = btoa(`${clientId.trim()}:${clientSecret.trim()}`);

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
    throw new Error(`Failed to authenticate: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Helper to construct prompt (same as apiService.ts)
function constructPrompt(payload: Payload): string {
  const { meeting_title, agenda, transcript, controls } = payload;

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

  promptParts.push(...controlEntries);

  return promptParts.join('\n');
}

// Test 1: Normal Mode (Meeting Notes Generation)
async function testNormalMode(accessToken: string) {
  console.log('\n========================================');
  console.log('TEST 1: NORMAL MODE (Meeting Notes)');
  console.log('========================================\n');

  const controls: Controls = {
    focus_department: [],
    view: 'full',
    critical_lens: true,
    audience: 'cross-functional',
    tone: 'professional',
    redact: false,
    status_view: 'embedded',
    meeting_date: new Date().toISOString().split('T')[0],
    rag_mode: 'rag',
    use_icons: true,
    bold_important_words: true,
    meetingPreset: 'internal-sync',
    meeting_coach: true,
    coaching_style: 'gentle',
    interrogation_mode: false,
    output_language: 'en',
  } as Controls & { output_language: string };

  const payload: Payload = {
    meeting_title: SAMPLE_MEETING.title,
    agenda: SAMPLE_MEETING.agenda,
    transcript: SAMPLE_MEETING.transcript,
    controls: controls,
  };

  const prompt = constructPrompt(payload);

  console.log('📤 Sending request to test agent...');
  console.log(`Agent ID: ${TEST_AGENT_ID}`);
  console.log(`Prompt length: ${prompt.length} characters\n`);

  const agentUrl = `${API_BASE_URL}/api/chat-ai/v1/bots/${TEST_AGENT_ID}/messages`;

  const response = await fetch(agentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message: prompt }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Agent API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
  }

  const responseData = await response.json();
  const rawResponse = responseData.message;

  console.log('📥 Response received!');
  console.log(`Response length: ${rawResponse.length} characters\n`);

  // Save raw response to file
  const fs = await import('fs');
  fs.writeFileSync('test-output-normal-mode-raw.txt', rawResponse, 'utf-8');
  console.log('✅ Raw response saved to: test-output-normal-mode-raw.txt\n');

  // Try to parse the response
  console.log('🔍 Analyzing response structure...\n');

  // Check for fenced JSON block
  const fencedJsonRegex = /```(?:json|jsonc|json5)?\s*({[\s\S]+?})\s*```/;
  const match = rawResponse.match(fencedJsonRegex);

  if (match && match[1]) {
    console.log('✅ Found fenced JSON block');
    try {
      const jsonString = match[1].trim();
      const parsedJson = JSON.parse(jsonString);

      console.log('\n📊 Parsed JSON structure:');
      console.log(`  - Has next_steps: ${Array.isArray(parsedJson.next_steps)} (${parsedJson.next_steps?.length || 0} items)`);
      console.log(`  - Has coach_insights: ${!!parsedJson.coach_insights}`);
      console.log(`  - Has suggested_questions: ${Array.isArray(parsedJson.suggested_questions)} (${parsedJson.suggested_questions?.length || 0} items)`);

      // Save parsed JSON
      fs.writeFileSync('test-output-normal-mode-parsed.json', JSON.stringify(parsedJson, null, 2), 'utf-8');
      console.log('\n✅ Parsed JSON saved to: test-output-normal-mode-parsed.json');

      // Extract markdown (everything before the JSON block)
      const markdownContent = rawResponse.substring(0, rawResponse.lastIndexOf(match[0])).trim();
      fs.writeFileSync('test-output-normal-mode-markdown.md', markdownContent, 'utf-8');
      console.log('✅ Markdown content saved to: test-output-normal-mode-markdown.md');

      return {
        markdown: markdownContent,
        json: parsedJson,
        rawResponse
      };
    } catch (e) {
      console.log('❌ Failed to parse JSON block:', e);
      return { markdown: rawResponse, json: null, rawResponse };
    }
  } else {
    console.log('❌ No fenced JSON block found');
    return { markdown: rawResponse, json: null, rawResponse };
  }
}

// Test 2: Interrogation Mode
async function testInterrogationMode(accessToken: string) {
  console.log('\n========================================');
  console.log('TEST 2: INTERROGATION MODE (Q&A)');
  console.log('========================================\n');

  const question = "What are the main action items and who is responsible for them?";

  const controls: Controls = {
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
    interrogation_mode: true,
    user_question: question,
  };

  const payload: Payload = {
    meeting_title: SAMPLE_MEETING.title,
    agenda: SAMPLE_MEETING.agenda,
    transcript: SAMPLE_MEETING.transcript,
    controls: controls,
  };

  const prompt = constructPrompt(payload);

  console.log('📤 Sending interrogation request...');
  console.log(`Question: "${question}"`);
  console.log(`Prompt length: ${prompt.length} characters\n`);

  const agentUrl = `${API_BASE_URL}/api/chat-ai/v1/bots/${TEST_AGENT_ID}/messages`;

  const response = await fetch(agentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message: prompt }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Agent API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
  }

  const responseData = await response.json();
  const rawResponse = responseData.message;

  console.log('📥 Response received!');
  console.log(`Response length: ${rawResponse.length} characters\n`);

  // Save raw response
  const fs = await import('fs');
  fs.writeFileSync('test-output-interrogation-raw.txt', rawResponse, 'utf-8');
  console.log('✅ Raw response saved to: test-output-interrogation-raw.txt\n');

  // Try to parse interrogation response
  console.log('🔍 Analyzing interrogation response...\n');

  const fencedJsonRegex = /```json\s*({[\s\S]+?})\s*```/;
  const match = rawResponse.match(fencedJsonRegex);

  if (match && match[1]) {
    console.log('✅ Found fenced JSON block');
    try {
      const parsedJson = JSON.parse(match[1]);

      console.log('\n📊 Parsed Interrogation Response:');
      console.log(`  - Question: ${parsedJson.question}`);
      console.log(`  - Answer: ${parsedJson.answer?.substring(0, 100)}...`);
      console.log(`  - Not in transcript: ${parsedJson.not_in_transcript}`);
      console.log(`  - Follow-up suggestions: ${parsedJson.follow_up_suggestions?.length || 0}`);

      fs.writeFileSync('test-output-interrogation-parsed.json', JSON.stringify(parsedJson, null, 2), 'utf-8');
      console.log('\n✅ Parsed JSON saved to: test-output-interrogation-parsed.json');

      return {
        interrogationResponse: parsedJson as InterrogationResponse,
        rawResponse
      };
    } catch (e) {
      console.log('❌ Failed to parse interrogation JSON:', e);
      return { interrogationResponse: null, rawResponse };
    }
  } else {
    console.log('❌ No fenced JSON block found in interrogation response');

    // Check if there's any extra text outside the fence
    if (rawResponse.trim().startsWith('```json') || rawResponse.includes('```json')) {
      console.log('⚠️  Response contains ```json marker but regex did not match');
      console.log('First 200 chars:', rawResponse.substring(0, 200));
      console.log('Last 200 chars:', rawResponse.substring(rawResponse.length - 200));
    }

    return { interrogationResponse: null, rawResponse };
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Agent Test Runner\n');
  console.log(`Test Agent ID: ${TEST_AGENT_ID}`);
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  // Check for credentials
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ Error: CLIENT_ID and CLIENT_SECRET environment variables must be set');
    console.log('\nUsage:');
    console.log('  CLIENT_ID=your-id CLIENT_SECRET=your-secret npx tsx test-agent-runner.ts');
    process.exit(1);
  }

  try {
    // Get auth token
    console.log('🔐 Authenticating...');
    const accessToken = await getAuthToken(clientId, clientSecret);
    console.log('✅ Authentication successful\n');

    // Run tests
    const normalModeResult = await testNormalMode(accessToken);
    const interrogationResult = await testInterrogationMode(accessToken);

    // Summary
    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================\n');

    console.log('Normal Mode:');
    console.log(`  - Markdown length: ${normalModeResult.markdown.length} chars`);
    console.log(`  - JSON parsed: ${normalModeResult.json ? '✅ Yes' : '❌ No'}`);
    if (normalModeResult.json) {
      console.log(`  - Next steps: ${normalModeResult.json.next_steps?.length || 0}`);
      console.log(`  - Coach insights: ${normalModeResult.json.coach_insights ? '✅ Yes' : '❌ No'}`);
      console.log(`  - Suggested questions: ${normalModeResult.json.suggested_questions?.length || 0}`);
    }

    console.log('\nInterrogation Mode:');
    console.log(`  - Response parsed: ${interrogationResult.interrogationResponse ? '✅ Yes' : '❌ No'}`);
    if (interrogationResult.interrogationResponse) {
      console.log(`  - Answer provided: ✅ Yes`);
      console.log(`  - Follow-ups: ${interrogationResult.interrogationResponse.follow_up_suggestions?.length || 0}`);
    }

    console.log('\n✅ All tests completed!');
    console.log('\nGenerated files:');
    console.log('  - test-output-normal-mode-raw.txt');
    console.log('  - test-output-normal-mode-markdown.md');
    console.log('  - test-output-normal-mode-parsed.json');
    console.log('  - test-output-interrogation-raw.txt');
    console.log('  - test-output-interrogation-parsed.json');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
