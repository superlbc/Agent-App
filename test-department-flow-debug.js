/**
 * Debug script for Momentum Department Data Power Automate Flow
 *
 * This shows the RAW response text to diagnose JSON parsing issues
 */

const FLOW_URL = "https://2e7cf80af71de950a36d4962c11a22.06.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/11a82bd0a6eb4da799b636025b1d7f9e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iGVxmlna0RFZSlWah_j40wb8uHiGpwEElw7MhCImNps";

async function testDepartmentFlow() {
  console.log('🔍 DEBUG MODE: Testing Momentum Department Data Flow...\n');

  const startTime = Date.now();

  try {
    console.log('📤 Sending POST request to Power Automate...');

    const response = await fetch(FLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAllDepartmentData',
        timestamp: new Date().toISOString(),
      }),
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Response received in ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      process.exit(1);
    }

    // Get raw text first
    console.log('📥 Reading raw response text...\n');
    const rawText = await response.text();

    console.log('='.repeat(80));
    console.log('RAW RESPONSE (first 2000 characters):');
    console.log('='.repeat(80));
    console.log(rawText.substring(0, 2000));
    console.log('='.repeat(80));
    console.log(`\nTotal response length: ${rawText.length} characters\n`);

    // Analyze the response
    console.log('🔍 ANALYSIS:\n');

    // Check for common issues
    if (rawText.startsWith('{') && rawText.includes('}{')) {
      console.log('❌ ISSUE FOUND: Multiple JSON objects concatenated');
      console.log('   The response contains multiple JSON objects without array brackets');
      console.log('   Fix: Ensure Response Body returns a SINGLE JSON object or array\n');
    }

    if (rawText.trim().startsWith('[') && rawText.trim().endsWith(']')) {
      console.log('⚠️  Response is a JSON array (might be okay if intentional)');
    }

    if (rawText.trim().startsWith('{') && rawText.trim().endsWith('}')) {
      console.log('✅ Response appears to be a single JSON object (good!)');
    }

    // Check for BOM or hidden characters
    const firstChar = rawText.charCodeAt(0);
    if (firstChar === 0xFEFF) {
      console.log('⚠️  Found UTF-8 BOM at start (might cause issues)');
    } else {
      console.log(`   First character code: ${firstChar} (${String.fromCharCode(firstChar)})`);
    }

    const lastChar = rawText.charCodeAt(rawText.length - 1);
    console.log(`   Last character code: ${lastChar} (${String.fromCharCode(lastChar)})`);

    // Try to parse
    console.log('\n🧪 Attempting to parse JSON...\n');
    try {
      const data = JSON.parse(rawText);
      console.log('✅ SUCCESS! JSON parsed successfully!\n');

      console.log('📋 Parsed Structure:');
      console.log(JSON.stringify(data, null, 2).substring(0, 1000));

      if (data.users && Array.isArray(data.users)) {
        console.log(`\n✅ Found ${data.users.length} users in response`);
        if (data.users.length > 0) {
          console.log('\n👤 First user:');
          console.log(JSON.stringify(data.users[0], null, 2));
        }
      }

    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('\n🔍 Error Position:', parseError.message.match(/position \d+/)?.[0]);

      if (parseError.message.includes('position')) {
        const match = parseError.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1]);
          const start = Math.max(0, pos - 50);
          const end = Math.min(rawText.length, pos + 50);
          console.error('\n📍 Context around error position:');
          console.error('---');
          console.error(rawText.substring(start, end));
          console.error('---');
          console.error(' '.repeat(Math.min(50, pos - start)) + '^');
        }
      }
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('\n❌ ERROR after', duration, 'ms\n');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testDepartmentFlow();
