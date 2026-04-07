/**
 * AI API Testing Script
 * Test all AI endpoints to verify functionality
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testEndpoint(name, method, path, body = null) {
  try {
    log(`\n📡 Testing: ${name}`, 'blue');
    log(`   ${method} ${path}`, 'yellow');

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();

    if (response.ok) {
      log(`   ✅ Success (${response.status})`, 'green');

      // Show sample of response
      if (data.response || data.summary || data.analysis) {
        const preview = (data.response || data.summary || data.analysis).substring(0, 150);
        log(`   📄 Preview: ${preview}...`, 'yellow');
      }

      return { success: true, data };
    } else {
      log(`   ❌ Error (${response.status}): ${data.error || response.statusText}`, 'red');
      return { success: false, error: data };
    }
  } catch (error) {
    log(`   ❌ Failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  section('AI API Testing Suite');
  log('Testing all AI endpoints...\n', 'cyan');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Health Check
  section('1. Health Check');
  const health = await testEndpoint('Health Check', 'GET', '/health');
  results.tests.push({ name: 'Health Check', ...health });
  if (health.success) results.passed++; else results.failed++;

  // Test 2: List AI Features
  section('2. List AI Features');
  const features = await testEndpoint('List AI Features', 'GET', '/api/ai/features');
  results.tests.push({ name: 'List Features', ...features });
  if (features.success) results.passed++; else results.failed++;

  // Test 3: Chat Interface
  section('3. Chat Interface');
  const chat = await testEndpoint('Send Chat Message', 'POST', '/api/ai/chat', {
    message: "What is eGFR?",
    includeContext: false
  });
  results.tests.push({ name: 'Chat', ...chat });
  if (chat.success) results.passed++; else results.failed++;

  // Test 4: Health Summary (may take longer)
  section('4. Health Summary');
  log('   ⏳ This may take 10-15 seconds...', 'yellow');
  const summary = await testEndpoint('Generate Health Summary', 'POST', '/api/ai/summary', {
    patientId: 'sample',
    includeTrends: true,
    includeAnomalies: true
  });
  results.tests.push({ name: 'Health Summary', ...summary });
  if (summary.success) results.passed++; else results.failed++;

  // Test 5: Natural Language Query
  section('5. Natural Language Query');
  const query = await testEndpoint('Natural Language Query', 'POST', '/api/ai/query', {
    query: "What's my average glucose?",
    patientId: 'sample'
  });
  results.tests.push({ name: 'NL Query', ...query });
  if (query.success) results.passed++; else results.failed++;

  // Test 6: Prediction Explanation
  section('6. Prediction Explanation');
  const prediction = await testEndpoint('Explain Predictions', 'POST', '/api/ai/prediction/explain', {
    labTestId: 'creatinine',
    forecastHorizon: 30
  });
  results.tests.push({ name: 'Prediction Explain', ...prediction });
  if (prediction.success) results.passed++; else results.failed++;

  // Test 7: Anomaly Explanation
  section('7. Anomaly Explanation');
  const anomaly = await testEndpoint('Explain Anomalies', 'POST', '/api/ai/anomaly/explain', {
    labTestId: 'alt'
  });
  results.tests.push({ name: 'Anomaly Explain', ...anomaly });
  if (anomaly.success) results.passed++; else results.failed++;

  // Test 8: Medication Analysis
  section('8. Medication Analysis');
  const medication = await testEndpoint('Medication Impact Analysis', 'POST', '/api/ai/medication/analyze', {
    medicationName: 'Lisinopril',
    labTestId: 'creatinine'
  });
  results.tests.push({ name: 'Medication Analysis', ...medication });
  if (medication.success) results.passed++; else results.failed++;

  // Test 9: Get Suggestions
  section('9. Chat Suggestions');
  const suggestions = await testEndpoint('Get Suggestions', 'GET', '/api/ai/suggestions');
  results.tests.push({ name: 'Suggestions', ...suggestions });
  if (suggestions.success) results.passed++; else results.failed++;

  // Test 10: Cost Statistics
  section('10. Cost Statistics');
  const costs = await testEndpoint('Get Cost Stats', 'GET', '/api/ai/costs');
  results.tests.push({ name: 'Cost Stats', ...costs });
  if (costs.success) results.passed++; else results.failed++;

  // Print Summary
  section('Test Summary');
  log(`Total Tests: ${results.passed + results.failed}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, 'red');
  log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`,
      results.passed === results.tests.length ? 'green' : 'yellow');

  // Show failed tests
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => !t.success).forEach(t => {
      log(`   - ${t.name}`, 'red');
    });
  }

  // Cost estimate
  if (costs.success && costs.data.totalCost) {
    console.log('\n💰 Estimated Costs:');
    log(`   Total Cost: $${costs.data.totalCost}`, 'yellow');
    log(`   Total Tokens: ${costs.data.totalTokens.toLocaleString()}`, 'yellow');
    log(`   Provider: ${costs.data.provider}`, 'yellow');
    log(`   Model: ${costs.data.model}`, 'yellow');
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed === 0) {
    log('✅ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Check logs above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
