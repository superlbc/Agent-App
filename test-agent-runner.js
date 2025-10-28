/**
 * Test Agent Runner (JavaScript version)
 *
 * This script tests the new agent system prompt by calling the test agent
 * in both normal mode (minutes generation) and interrogation mode (Q&A).
 *
 * Usage: node test-agent-runner.js
 */

import fs from 'fs';

// Agent Configuration
const NOTES_AGENT_ID = 'b8460071-daee-4820-8198-5224fdc99e45';  // Meeting Notes Generation Agent
const INTERROGATION_AGENT_ID = 'f8bf98dc-997c-4993-bbd6-02245b8b0044';  // Interrogation Q&A Agent
const API_BASE_URL = 'https://interact.interpublic.com';

// Sample Meeting Data (from constants.ts)
const SAMPLE_MEETING = {
  title: "ACL Weekly Team Status – 8/26",
  agenda: ["ACL Nights Show", "Main Footprint", "Side Stage"],
  transcript: "Alright team, let's kick off. Main footprint status? John reports we are green on talent booking. Let's talk about the side stage. We need to finalize the audio vendor by EOD Friday. Casey to mock up blanket and hat designs, due date is 2025-09-02. This is for the ACL Nights show. Sarah, can you please coordinate with the city on permits? Make sure to check with legal@example.com before signing anything. Their number is (555) 123-4567. We need a decision on the catering options for the VIP area. That's a key risk if we don't lock it down. Bob will own the decision on catering.",
};

// Helper to get auth token
async function getAuthToken(clientId, clientSecret) {
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
function constructPrompt(payload) {
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
    .filter(Boolean);

  promptParts.push(...controlEntries);

  return promptParts.join('\n');
}

// Test 1: Normal Mode (Meeting Notes Generation)
async function testNormalMode(accessToken) {
  console.log('\n========================================');
  console.log('TEST 1: NORMAL MODE (Meeting Notes)');
  console.log('========================================\n');

  const controls = {
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
  };

  const payload = {
    meeting_title: SAMPLE_MEETING.title,
    agenda: SAMPLE_MEETING.agenda,
    transcript: SAMPLE_MEETING.transcript,
    controls: controls,
  };

  const prompt = constructPrompt(payload);

  console.log('📤 Sending request to Meeting Notes Agent...');
  console.log(`Agent ID: ${NOTES_AGENT_ID}`);
  console.log(`Prompt length: ${prompt.length} characters\n`);

  const agentUrl = `${API_BASE_URL}/api/chat-ai/v1/bots/${NOTES_AGENT_ID}/messages`;

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

      if (parsedJson.next_steps && parsedJson.next_steps.length > 0) {
        console.log('\n📋 Sample Next Step:');
        const firstStep = parsedJson.next_steps[0];
        console.log(`  Department: ${firstStep.department}`);
        console.log(`  Owner: ${firstStep.owner}`);
        console.log(`  Task: ${firstStep.task?.substring(0, 60)}...`);
        console.log(`  Status: ${firstStep.status}`);
      }

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
        rawResponse,
        success: true
      };
    } catch (e) {
      console.log('❌ Failed to parse JSON block:', e.message);
      return { markdown: rawResponse, json: null, rawResponse, success: false, error: e.message };
    }
  } else {
    console.log('❌ No fenced JSON block found');
    console.log('\n⚠️  Checking for common issues:');

    // Check if there's JSON-like content without fences
    if (rawResponse.includes('"next_steps"')) {
      console.log('  - Found "next_steps" key but no proper fencing');
    }

    // Check if response has markdown headers
    if (rawResponse.includes('###') || rawResponse.includes('##')) {
      console.log('  - Response contains markdown headers');
    }

    // Show first and last 300 characters for debugging
    console.log('\n📝 Response preview:');
    console.log('First 300 chars:', rawResponse.substring(0, 300));
    console.log('\nLast 300 chars:', rawResponse.substring(Math.max(0, rawResponse.length - 300)));

    return { markdown: rawResponse, json: null, rawResponse, success: false };
  }
}

// Test 2: Interrogation Mode
async function testInterrogationMode(accessToken) {
  console.log('\n========================================');
  console.log('TEST 2: INTERROGATION MODE (Q&A)');
  console.log('========================================\n');

  const question = "What are the main action items and who is responsible for them?";

  const controls = {
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

  const payload = {
    meeting_title: SAMPLE_MEETING.title,
    agenda: SAMPLE_MEETING.agenda,
    transcript: SAMPLE_MEETING.transcript,
    controls: controls,
  };

  const prompt = constructPrompt(payload);

  console.log('📤 Sending interrogation request...');
  console.log(`Agent ID: ${INTERROGATION_AGENT_ID}`);
  console.log(`Question: "${question}"`);
  console.log(`Prompt length: ${prompt.length} characters\n`);

  const agentUrl = `${API_BASE_URL}/api/chat-ai/v1/bots/${INTERROGATION_AGENT_ID}/messages`;

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
      console.log(`  - Answer length: ${parsedJson.answer?.length || 0} chars`);
      console.log(`  - Answer preview: ${parsedJson.answer?.substring(0, 150)}...`);
      console.log(`  - Not in transcript: ${parsedJson.not_in_transcript}`);
      console.log(`  - Follow-up suggestions: ${parsedJson.follow_up_suggestions?.length || 0}`);

      if (parsedJson.follow_up_suggestions && parsedJson.follow_up_suggestions.length > 0) {
        console.log('\n💡 Follow-up suggestions:');
        parsedJson.follow_up_suggestions.forEach((suggestion, i) => {
          console.log(`  ${i + 1}. ${suggestion}`);
        });
      }

      fs.writeFileSync('test-output-interrogation-parsed.json', JSON.stringify(parsedJson, null, 2), 'utf-8');
      console.log('\n✅ Parsed JSON saved to: test-output-interrogation-parsed.json');

      // Check for text outside the fence (should be none according to STRICT FENCE PROTOCOL)
      const beforeFence = rawResponse.substring(0, rawResponse.indexOf('```json')).trim();
      const afterFence = rawResponse.substring(rawResponse.lastIndexOf('```') + 3).trim();

      if (beforeFence.length > 0 || afterFence.length > 0) {
        console.log('\n⚠️  STRICT FENCE PROTOCOL VIOLATION:');
        if (beforeFence.length > 0) {
          console.log(`  - Text before fence (${beforeFence.length} chars): "${beforeFence.substring(0, 100)}..."`);
        }
        if (afterFence.length > 0) {
          console.log(`  - Text after fence (${afterFence.length} chars): "${afterFence.substring(0, 100)}..."`);
        }
      } else {
        console.log('\n✅ STRICT FENCE PROTOCOL: No text outside fences (correct!)');
      }

      return {
        interrogationResponse: parsedJson,
        rawResponse,
        success: true,
        fenceViolation: beforeFence.length > 0 || afterFence.length > 0
      };
    } catch (e) {
      console.log('❌ Failed to parse interrogation JSON:', e.message);
      return { interrogationResponse: null, rawResponse, success: false, error: e.message };
    }
  } else {
    console.log('❌ No fenced JSON block found in interrogation response');

    // Check if there's any extra text outside the fence
    if (rawResponse.trim().startsWith('```json') || rawResponse.includes('```json')) {
      console.log('⚠️  Response contains ```json marker but regex did not match');
      console.log('First 300 chars:', rawResponse.substring(0, 300));
      console.log('Last 300 chars:', rawResponse.substring(Math.max(0, rawResponse.length - 300)));
    }

    return { interrogationResponse: null, rawResponse, success: false };
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Agent Test Runner\n');
  console.log('Agent IDs:');
  console.log(`  Meeting Notes Agent: ${NOTES_AGENT_ID}`);
  console.log(`  Interrogation Agent: ${INTERROGATION_AGENT_ID}`);
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  // Get credentials from environment or use defaults from .env.local
  const clientId = process.env.CLIENT_ID || 'MeetingNotes';
  const clientSecret = process.env.CLIENT_SECRET || 'eOk9dez@#En@nWw2w%0N';

  console.log('✅ Using credentials from .env.local\n');

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
    console.log('TEST SUMMARY');
    console.log('========================================\n');

    console.log('📊 Normal Mode (Meeting Notes):');
    console.log(`  Status: ${normalModeResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`  Markdown length: ${normalModeResult.markdown.length} chars`);
    console.log(`  JSON parsed: ${normalModeResult.json ? '✅ Yes' : '❌ No'}`);
    if (normalModeResult.json) {
      console.log(`  Next steps: ${normalModeResult.json.next_steps?.length || 0}`);
      console.log(`  Coach insights: ${normalModeResult.json.coach_insights ? '✅ Present' : '❌ Missing'}`);
      console.log(`  Suggested questions: ${normalModeResult.json.suggested_questions?.length || 0}`);
    }
    if (normalModeResult.error) {
      console.log(`  Error: ${normalModeResult.error}`);
    }

    console.log('\n❓ Interrogation Mode (Q&A):');
    console.log(`  Status: ${interrogationResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`  Response parsed: ${interrogationResult.interrogationResponse ? '✅ Yes' : '❌ No'}`);
    if (interrogationResult.interrogationResponse) {
      console.log(`  Answer provided: ✅ Yes (${interrogationResult.interrogationResponse.answer.length} chars)`);
      console.log(`  Follow-ups: ${interrogationResult.interrogationResponse.follow_up_suggestions?.length || 0}`);
      console.log(`  Fence protocol: ${interrogationResult.fenceViolation ? '⚠️  Violated' : '✅ Compliant'}`);
    }
    if (interrogationResult.error) {
      console.log(`  Error: ${interrogationResult.error}`);
    }

    console.log('\n📁 Generated files:');
    console.log('  - test-output-normal-mode-raw.txt');
    console.log('  - test-output-normal-mode-markdown.md');
    console.log('  - test-output-normal-mode-parsed.json');
    console.log('  - test-output-interrogation-raw.txt');
    console.log('  - test-output-interrogation-parsed.json');

    console.log('\n✅ All tests completed!');
    console.log('\n💡 Next steps:');
    console.log('  1. Review the generated files above');
    console.log('  2. Check if markdown structure is as expected');
    console.log('  3. Verify JSON format matches application needs');
    console.log('  4. Identify any broken/missing formatting');

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
