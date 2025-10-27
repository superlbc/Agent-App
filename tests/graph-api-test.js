/**
 * Microsoft Graph API Endpoint Tester (Node.js Version)
 *
 * Run with: node graph-api-test.js
 *
 * Prerequisites:
 * - npm install @azure/msal-node @microsoft/microsoft-graph-client isomorphic-fetch
 * - Set environment variables (see below)
 */

const msal = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

// Configuration (set via environment variables or hardcode for testing)
const config = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'YOUR_TENANT_ID_HERE'}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE' // For daemon/app-only flow
  }
};

const msalClient = new msal.ConfidentialClientApplication(config);

// Scopes for delegated permissions (for interactive login)
const delegatedScopes = [
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/Calendars.Read',
  'https://graph.microsoft.com/OnlineMeetings.Read',
  'https://graph.microsoft.com/OnlineMeetingTranscript.Read',
  'https://graph.microsoft.com/Files.Read'
];

// Test results storage
const testResults = {};
let graphClient;
let selectedMeetingId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, message) {
  const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏳';
  const statusColor = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${statusIcon} ${testName}: ${message}`, statusColor);
}

/**
 * Initialize Graph Client with access token
 */
async function initializeGraphClient() {
  try {
    log('\n🔐 Authenticating with Microsoft Graph API...', 'cyan');

    // For testing purposes, we'll use device code flow (interactive)
    // In production, you'd use the app's authentication method
    const deviceCodeRequest = {
      deviceCodeCallback: (response) => {
        log(`\n${response.message}`, 'yellow');
      },
      scopes: delegatedScopes
    };

    const response = await msalClient.acquireTokenByDeviceCode(deviceCodeRequest);

    log('✅ Authentication successful!', 'green');
    log(`   User: ${response.account.username}`, 'cyan');

    // Initialize Graph client
    graphClient = Client.init({
      authProvider: (done) => {
        done(null, response.accessToken);
      }
    });

    return true;
  } catch (error) {
    log('❌ Authentication failed!', 'red');
    console.error(error);
    return false;
  }
}

/**
 * Test 1: User Profile
 */
async function testUserProfile() {
  const testName = 'User Profile';
  log(`\n📋 Testing ${testName}...`, 'cyan');

  try {
    const user = await graphClient
      .api('/me')
      .select('displayName,mail,userPrincipalName,jobTitle')
      .get();

    testResults.userProfile = {
      success: true,
      endpoint: '/me',
      data: user
    };

    logTest(testName, 'pass', `Retrieved profile for ${user.displayName}`);
    log(`   Email: ${user.mail}`, 'cyan');
    log(`   Job Title: ${user.jobTitle || 'Not specified'}`, 'cyan');

    return true;
  } catch (error) {
    testResults.userProfile = {
      success: false,
      endpoint: '/me',
      error: error.message
    };

    logTest(testName, 'fail', error.message);
    return false;
  }
}

/**
 * Test 2: Calendar Events
 */
async function testCalendar() {
  const testName = 'Calendar Events';
  log(`\n📅 Testing ${testName}...`, 'cyan');

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const events = await graphClient
      .api('/me/calendar/calendarView')
      .query({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        $select: 'subject,start,end,organizer,attendees,onlineMeeting,isOrganizer',
        $top: 10
      })
      .get();

    // Find a Teams meeting for subsequent tests
    const teamsMeeting = events.value.find(e => e.onlineMeeting);

    testResults.calendar = {
      success: true,
      endpoint: '/me/calendar/calendarView',
      data: {
        totalEvents: events.value.length,
        teamsMeetings: events.value.filter(e => e.onlineMeeting).length,
        sample: events.value.slice(0, 3)
      }
    };

    logTest(testName, 'pass', `Found ${events.value.length} events`);
    log(`   Teams meetings: ${events.value.filter(e => e.onlineMeeting).length}`, 'cyan');

    if (teamsMeeting) {
      selectedMeetingId = teamsMeeting.id;
      log(`   📌 Selected meeting for transcript tests: "${teamsMeeting.subject}"`, 'magenta');
    } else {
      log(`   ⚠️  No Teams meetings found - transcript tests may fail`, 'yellow');
    }

    return true;
  } catch (error) {
    testResults.calendar = {
      success: false,
      endpoint: '/me/calendar/calendarView',
      error: error.message
    };

    logTest(testName, 'fail', error.message);
    return false;
  }
}

/**
 * Test 3: Meeting Details
 */
async function testMeetingDetails() {
  const testName = 'Meeting Details';
  log(`\n🎯 Testing ${testName}...`, 'cyan');

  if (!selectedMeetingId) {
    testResults.meetingDetails = {
      success: false,
      endpoint: '/me/events/{id}',
      error: 'No meeting selected (calendar test may have failed)'
    };

    logTest(testName, 'fail', 'No meeting available for testing');
    return false;
  }

  try {
    const meeting = await graphClient
      .api(`/me/events/${selectedMeetingId}`)
      .select('subject,start,end,organizer,attendees,body,location,onlineMeeting')
      .get();

    testResults.meetingDetails = {
      success: true,
      endpoint: `/me/events/${selectedMeetingId}`,
      data: {
        subject: meeting.subject,
        attendeeCount: meeting.attendees?.length || 0,
        hasOnlineMeeting: !!meeting.onlineMeeting,
        joinUrl: meeting.onlineMeeting?.joinUrl
      }
    };

    logTest(testName, 'pass', `Retrieved details for "${meeting.subject}"`);
    log(`   Attendees: ${meeting.attendees?.length || 0}`, 'cyan');
    log(`   Join URL: ${meeting.onlineMeeting?.joinUrl ? 'Available' : 'Not available'}`, 'cyan');

    return true;
  } catch (error) {
    testResults.meetingDetails = {
      success: false,
      endpoint: `/me/events/${selectedMeetingId}`,
      error: error.message
    };

    logTest(testName, 'fail', error.message);
    return false;
  }
}

/**
 * Test 4: Transcript Strategy 1 - OnlineMeetings API
 */
async function testTranscriptStrategy1() {
  const testName = 'Transcript Strategy 1 (OnlineMeetings API)';
  log(`\n📝 Testing ${testName}...`, 'cyan');

  if (!selectedMeetingId) {
    testResults.transcriptStrategy1 = {
      success: false,
      endpoint: '/me/onlineMeetings/{id}/transcripts',
      error: 'No meeting selected'
    };

    logTest(testName, 'fail', 'No meeting available for testing');
    return false;
  }

  try {
    // First, try to get the online meeting via joinWebUrl
    const meeting = await graphClient
      .api(`/me/events/${selectedMeetingId}`)
      .select('onlineMeeting')
      .get();

    if (!meeting.onlineMeeting) {
      throw new Error('Meeting does not have online meeting data');
    }

    const joinUrl = meeting.onlineMeeting.joinUrl;

    // Try to find the online meeting
    // Note: This endpoint may not work with delegated permissions
    const onlineMeetings = await graphClient
      .api('/me/onlineMeetings')
      .filter(`joinWebUrl eq '${joinUrl}'`)
      .get();

    if (!onlineMeetings.value || onlineMeetings.value.length === 0) {
      throw new Error('Could not find online meeting by join URL');
    }

    const onlineMeetingId = onlineMeetings.value[0].id;

    // Try to get transcripts
    const transcripts = await graphClient
      .api(`/me/onlineMeetings/${onlineMeetingId}/transcripts`)
      .get();

    testResults.transcriptStrategy1 = {
      success: true,
      endpoint: `/me/onlineMeetings/${onlineMeetingId}/transcripts`,
      data: {
        transcriptCount: transcripts.value?.length || 0,
        transcripts: transcripts.value
      }
    };

    logTest(testName, 'pass', `Found ${transcripts.value?.length || 0} transcript(s)`);

    return true;
  } catch (error) {
    testResults.transcriptStrategy1 = {
      success: false,
      endpoint: '/me/onlineMeetings/{id}/transcripts',
      error: error.message,
      statusCode: error.statusCode
    };

    logTest(testName, 'fail', `${error.message} (${error.statusCode || 'Unknown'})`);

    if (error.statusCode === 403) {
      log('   💡 Hint: This may require OnlineMeetingTranscript.Read permission', 'yellow');
    }

    return false;
  }
}

/**
 * Test 5: Transcript Strategy 2 - OneDrive Recordings
 */
async function testTranscriptStrategy2() {
  const testName = 'Transcript Strategy 2 (OneDrive)';
  log(`\n📁 Testing ${testName}...`, 'cyan');

  try {
    const files = await graphClient
      .api('/me/drive/root:/Recordings:/children')
      .get();

    const transcriptFiles = files.value.filter(f =>
      f.name.toLowerCase().includes('transcript')
    );

    testResults.transcriptStrategy2 = {
      success: true,
      endpoint: '/me/drive/root:/Recordings:/children',
      data: {
        totalFiles: files.value.length,
        transcriptFiles: transcriptFiles.length,
        samples: transcriptFiles.slice(0, 3).map(f => f.name)
      }
    };

    logTest(testName, 'pass', `Found ${files.value.length} file(s) in Recordings folder`);
    log(`   Transcript files: ${transcriptFiles.length}`, 'cyan');

    if (transcriptFiles.length > 0) {
      log(`   Sample: ${transcriptFiles[0].name}`, 'cyan');
    }

    return true;
  } catch (error) {
    testResults.transcriptStrategy2 = {
      success: false,
      endpoint: '/me/drive/root:/Recordings:/children',
      error: error.message,
      statusCode: error.statusCode
    };

    logTest(testName, 'fail', `${error.message} (${error.statusCode || 'Unknown'})`);

    if (error.statusCode === 404) {
      log('   💡 Hint: Recordings folder may not exist (auto-save not enabled)', 'yellow');
    }

    return false;
  }
}

/**
 * Test 6: Transcript Strategy 3 - Teams Chat Files
 */
async function testTranscriptStrategy3() {
  const testName = 'Transcript Strategy 3 (Teams Chat Files)';
  log(`\n💬 Testing ${testName}...`, 'cyan');

  try {
    const files = await graphClient
      .api('/me/drive/root:/Microsoft Teams Chat Files:/children')
      .get();

    const transcriptFiles = files.value.filter(f =>
      f.name.toLowerCase().includes('transcript')
    );

    testResults.transcriptStrategy3 = {
      success: true,
      endpoint: '/me/drive/root:/Microsoft Teams Chat Files:/children',
      data: {
        totalFiles: files.value.length,
        transcriptFiles: transcriptFiles.length,
        samples: transcriptFiles.slice(0, 3).map(f => f.name)
      }
    };

    logTest(testName, 'pass', `Found ${files.value.length} file(s) in Teams Chat Files`);
    log(`   Transcript files: ${transcriptFiles.length}`, 'cyan');

    if (transcriptFiles.length > 0) {
      log(`   Sample: ${transcriptFiles[0].name}`, 'cyan');
    }

    return true;
  } catch (error) {
    testResults.transcriptStrategy3 = {
      success: false,
      endpoint: '/me/drive/root:/Microsoft Teams Chat Files:/children',
      error: error.message,
      statusCode: error.statusCode
    };

    logTest(testName, 'fail', `${error.message} (${error.statusCode || 'Unknown'})`);

    return false;
  }
}

/**
 * Print summary report
 */
function printSummary() {
  log('\n' + '='.repeat(60), 'bright');
  log('📊 TEST SUMMARY', 'bright');
  log('='.repeat(60), 'bright');

  const results = Object.entries(testResults);
  const passed = results.filter(([_, r]) => r.success).length;
  const failed = results.filter(([_, r]) => !r.success).length;

  log(`\nTotal Tests: ${results.length}`, 'cyan');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');

  // Transcript access summary
  log('\n📝 TRANSCRIPT ACCESS ANALYSIS:', 'bright');

  const transcript1 = testResults.transcriptStrategy1?.success;
  const transcript2 = testResults.transcriptStrategy2?.success;
  const transcript3 = testResults.transcriptStrategy3?.success;

  if (transcript1) {
    log('✅ Strategy 1 (OnlineMeetings API): WORKING', 'green');
    log('   Recommendation: Use direct API access for transcripts', 'cyan');
  } else if (transcript2) {
    log('✅ Strategy 2 (OneDrive): WORKING', 'green');
    log('   Recommendation: Search OneDrive Recordings folder for transcript files', 'cyan');
  } else if (transcript3) {
    log('✅ Strategy 3 (Teams Chat Files): WORKING', 'green');
    log('   Recommendation: Search Teams Chat Files folder for transcript files', 'cyan');
  } else {
    log('❌ No automatic transcript access available', 'red');
    log('   Recommendation: Use Power Automate fallback or manual paste', 'yellow');
  }

  log('\n' + '='.repeat(60), 'bright');

  // Save results to file
  const fs = require('fs');
  const outputPath = './graph-api-test-results.json';
  fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));
  log(`\n💾 Full results saved to: ${outputPath}`, 'green');
}

/**
 * Main execution
 */
async function main() {
  log('╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║   Microsoft Graph API Endpoint Tester (Node.js)           ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');

  // Validate configuration
  if (config.auth.clientId === 'YOUR_CLIENT_ID_HERE') {
    log('\n❌ ERROR: Please set AZURE_CLIENT_ID environment variable or update config', 'red');
    log('   Example: export AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc', 'yellow');
    process.exit(1);
  }

  // Initialize
  const authenticated = await initializeGraphClient();
  if (!authenticated) {
    log('\n❌ Authentication failed. Exiting.', 'red');
    process.exit(1);
  }

  // Run tests
  log('\n' + '='.repeat(60), 'bright');
  log('🧪 RUNNING TESTS', 'bright');
  log('='.repeat(60), 'bright');

  await testUserProfile();
  await testCalendar();
  await testMeetingDetails();
  await testTranscriptStrategy1();
  await testTranscriptStrategy2();
  await testTranscriptStrategy3();

  // Print summary
  printSummary();

  log('\n✅ Testing complete!\n', 'green');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    log('\n❌ Unexpected error:', 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  initializeGraphClient,
  testUserProfile,
  testCalendar,
  testMeetingDetails,
  testTranscriptStrategy1,
  testTranscriptStrategy2,
  testTranscriptStrategy3
};
