/**
 * Test script for Momentum Department Data Power Automate Flow
 *
 * This script tests the Power Automate flow endpoint to verify:
 * 1. Connection is successful
 * 2. Response format is correct
 * 3. Data contains expected fields
 * 4. Number of records returned
 *
 * Usage: node test-department-flow.js
 */

const FLOW_URL = "https://2e7cf80af71de950a36d4962c11a22.06.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/11a82bd0a6eb4da799b636025b1d7f9e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iGVxmlna0RFZSlWah_j40wb8uHiGpwEElw7MhCImNps";

async function testDepartmentFlow() {
  console.log('🧪 Testing Momentum Department Data Flow...\n');
  console.log('Flow URL:', FLOW_URL);
  console.log('\n' + '='.repeat(80) + '\n');

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

    console.log('📥 Parsing JSON response...');
    const data = await response.json();

    console.log('\n' + '='.repeat(80));
    console.log('✅ SUCCESS - Flow responded successfully!\n');

    // Validate response structure
    console.log('📋 Response Structure:');
    console.log(`   - success: ${data.success}`);
    console.log(`   - timestamp: ${data.timestamp || 'N/A'}`);
    console.log(`   - recordCount: ${data.recordCount || 'N/A'}`);
    console.log(`   - users: ${Array.isArray(data.users) ? 'Array' : typeof data.users}`);

    if (data.users && Array.isArray(data.users)) {
      console.log(`   - users.length: ${data.users.length}\n`);

      if (data.users.length > 0) {
        console.log('👤 Sample User Record (first entry):');
        const sampleUser = data.users[0];
        console.log(JSON.stringify(sampleUser, null, 2));

        console.log('\n📝 Field Analysis:');
        const fields = Object.keys(sampleUser);
        console.log(`   Fields present: ${fields.join(', ')}`);

        // Check for expected fields
        const expectedFields = ['EmailAddress', 'Name', 'DepartmentGroup', 'Department', 'GradeGroup', 'RoleWithoutNumbers'];
        const missingFields = expectedFields.filter(f => !fields.includes(f));
        const extraFields = fields.filter(f => !expectedFields.includes(f));

        if (missingFields.length > 0) {
          console.log(`   ⚠️  Missing expected fields: ${missingFields.join(', ')}`);
        } else {
          console.log('   ✅ All expected fields present');
        }

        if (extraFields.length > 0) {
          console.log(`   ℹ️  Extra fields (not used): ${extraFields.join(', ')}`);
        }

        // Statistics
        console.log('\n📊 Data Statistics:');
        let withEmail = 0;
        let withDepartment = 0;
        let withDepartmentGroup = 0;
        let withRole = 0;

        data.users.forEach(user => {
          if (user.EmailAddress) withEmail++;
          if (user.Department) withDepartment++;
          if (user.DepartmentGroup) withDepartmentGroup++;
          if (user.RoleWithoutNumbers) withRole++;
        });

        console.log(`   Total users: ${data.users.length}`);
        console.log(`   Users with email: ${withEmail} (${Math.round(withEmail/data.users.length*100)}%)`);
        console.log(`   Users with department: ${withDepartment} (${Math.round(withDepartment/data.users.length*100)}%)`);
        console.log(`   Users with departmentGroup: ${withDepartmentGroup} (${Math.round(withDepartmentGroup/data.users.length*100)}%)`);
        console.log(`   Users with role: ${withRole} (${Math.round(withRole/data.users.length*100)}%)`);

        // Show a few more sample emails for reference
        console.log('\n📧 Sample Email Addresses (first 5):');
        data.users.slice(0, 5).forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.EmailAddress || 'N/A'} - ${user.Name || 'N/A'}`);
        });
      } else {
        console.log('⚠️  WARNING: Users array is empty!');
      }
    } else {
      console.log('❌ ERROR: "users" field is not an array or is missing');
      console.log('Received data:', JSON.stringify(data, null, 2));
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 Test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify the field names match your expectations');
    console.log('   2. Check that the number of users is around 1000');
    console.log('   3. Start the app and log in to see it in action');
    console.log('   4. Check browser console for department data logs');
    console.log('\n');

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('\n❌ ERROR after', duration, 'ms\n');

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error - could be:');
      console.error('  - CORS issue (less likely with Power Automate)');
      console.error('  - Network connectivity problem');
      console.error('  - Invalid URL');
    } else if (error.name === 'AbortError') {
      console.error('Request timed out');
    } else {
      console.error('Error details:', error.message);
    }

    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the test
testDepartmentFlow();
