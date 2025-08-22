#!/usr/bin/env node

/**
 * Integration Test Runner
 * Runs comprehensive integration tests for the Manifiesto Scanner
 * Generates detailed reports and coverage metrics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  timeout: 60000, // 60 seconds per test
  maxWorkers: 4,
  verbose: true,
  coverage: true,
  bail: false, // Continue running tests even if some fail
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'End-to-End Integration Tests',
    pattern: 'components/manifiesto-scanner/__tests__/EndToEnd.integration.test.tsx',
    description: 'Complete workflow tests from image upload to data export',
  },
  {
    name: 'Browser Compatibility Tests',
    pattern: 'components/manifiesto-scanner/__tests__/BrowserCompatibility.integration.test.tsx',
    description: 'Cross-browser functionality and feature detection tests',
  },
  {
    name: 'Mobile/Desktop Compatibility Tests',
    pattern: 'components/manifiesto-scanner/__tests__/MobileDesktop.integration.test.tsx',
    description: 'Responsive design and device-specific functionality tests',
  },
  {
    name: 'Accuracy Validation Tests',
    pattern: 'components/manifiesto-scanner/__tests__/AccuracyValidation.integration.test.tsx',
    description: 'OCR accuracy validation against manual input benchmarks',
  },
  {
    name: 'Performance Integration Tests',
    pattern: 'utils/manifiesto/__tests__/performance.integration.test.ts',
    description: 'Performance benchmarks and optimization validation',
  },
  {
    name: 'Error Handling Integration Tests',
    pattern: 'utils/manifiesto/__tests__/errorHandling.integration.test.ts',
    description: 'Error scenarios and recovery mechanism tests',
  },
];

// Utility functions
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const runCommand = (command, options = {}) => {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
};

const generateTestReport = (results) => {
  const reportPath = path.join(__dirname, '../test-reports');
  
  // Ensure report directory exists
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSuites: results.length,
      passedSuites: results.filter(r => r.success).length,
      failedSuites: results.filter(r => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
    },
    results: results,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };

  const reportFile = path.join(reportPath, `integration-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  log(`Test report generated: ${reportFile}`, 'success');
  return report;
};

const printSummary = (report) => {
  console.log('\n' + '='.repeat(80));
  console.log('INTEGRATION TEST SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`Total Test Suites: ${report.summary.totalSuites}`);
  console.log(`Passed: ${report.summary.passedSuites} ✅`);
  console.log(`Failed: ${report.summary.failedSuites} ${report.summary.failedSuites > 0 ? '❌' : ''}`);
  console.log(`Total Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
  
  console.log('\nDetailed Results:');
  console.log('-'.repeat(80));
  
  report.results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? `(${(result.duration / 1000).toFixed(2)}s)` : '';
    console.log(`${index + 1}. ${status} ${result.suite} ${duration}`);
    
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error.split('\n')[0]}`);
    }
  });
  
  if (report.summary.failedSuites > 0) {
    console.log('\n⚠️  Some tests failed. Check the detailed output above for more information.');
    console.log('💡 Tip: Run individual test suites with: npm test -- --testPathPattern="<pattern>"');
  } else {
    console.log('\n🎉 All integration tests passed!');
  }
  
  console.log('='.repeat(80));
};

// Main execution
const main = async () => {
  log('Starting Integration Test Suite', 'info');
  log(`Running ${TEST_SUITES.length} test suites with ${TEST_CONFIG.maxWorkers} workers`);
  
  const results = [];
  
  for (const suite of TEST_SUITES) {
    log(`Running: ${suite.name}`, 'info');
    log(`Description: ${suite.description}`);
    
    const startTime = Date.now();
    
    // Build Jest command
    const jestCommand = [
      'npx jest',
      `--testPathPattern="${suite.pattern}"`,
      `--maxWorkers=${TEST_CONFIG.maxWorkers}`,
      `--testTimeout=${TEST_CONFIG.timeout}`,
      TEST_CONFIG.verbose ? '--verbose' : '',
      TEST_CONFIG.coverage ? '--coverage --coverageDirectory=coverage/integration' : '',
      TEST_CONFIG.bail ? '--bail' : '',
      '--detectOpenHandles',
      '--forceExit',
    ].filter(Boolean).join(' ');
    
    const result = runCommand(jestCommand);
    const duration = Date.now() - startTime;
    
    const suiteResult = {
      suite: suite.name,
      pattern: suite.pattern,
      description: suite.description,
      success: result.success,
      duration,
      output: result.output,
      error: result.error,
    };
    
    results.push(suiteResult);
    
    if (result.success) {
      log(`✅ ${suite.name} completed successfully (${(duration / 1000).toFixed(2)}s)`, 'success');
    } else {
      log(`❌ ${suite.name} failed (${(duration / 1000).toFixed(2)}s)`, 'error');
      if (result.error) {
        console.log('Error details:', result.error);
      }
    }
    
    console.log(''); // Add spacing between suites
  }
  
  // Generate and display report
  const report = generateTestReport(results);
  printSummary(report);
  
  // Exit with appropriate code
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
};

// Handle CLI arguments
const args = process.argv.slice(2);
const helpFlag = args.includes('--help') || args.includes('-h');

if (helpFlag) {
  console.log(`
Integration Test Runner

Usage: node scripts/run-integration-tests.js [options]

Options:
  --help, -h          Show this help message
  --suite <name>      Run specific test suite by name
  --pattern <pattern> Run tests matching pattern
  --no-coverage       Skip coverage collection
  --bail              Stop on first failure

Available Test Suites:
${TEST_SUITES.map((suite, i) => `  ${i + 1}. ${suite.name}\n     ${suite.description}`).join('\n')}

Examples:
  node scripts/run-integration-tests.js
  node scripts/run-integration-tests.js --suite "End-to-End Integration Tests"
  node scripts/run-integration-tests.js --pattern "EndToEnd" --no-coverage
`);
  process.exit(0);
}

// Handle specific suite selection
const suiteFlag = args.indexOf('--suite');
if (suiteFlag !== -1 && args[suiteFlag + 1]) {
  const suiteName = args[suiteFlag + 1];
  const selectedSuite = TEST_SUITES.find(s => s.name === suiteName);
  
  if (selectedSuite) {
    TEST_SUITES.length = 0;
    TEST_SUITES.push(selectedSuite);
    log(`Running specific suite: ${suiteName}`);
  } else {
    log(`Suite not found: ${suiteName}`, 'error');
    log(`Available suites: ${TEST_SUITES.map(s => s.name).join(', ')}`);
    process.exit(1);
  }
}

// Handle pattern selection
const patternFlag = args.indexOf('--pattern');
if (patternFlag !== -1 && args[patternFlag + 1]) {
  const pattern = args[patternFlag + 1];
  const matchingSuites = TEST_SUITES.filter(s => 
    s.name.toLowerCase().includes(pattern.toLowerCase()) ||
    s.pattern.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (matchingSuites.length > 0) {
    TEST_SUITES.length = 0;
    TEST_SUITES.push(...matchingSuites);
    log(`Running suites matching pattern: ${pattern}`);
  } else {
    log(`No suites found matching pattern: ${pattern}`, 'error');
    process.exit(1);
  }
}

// Handle coverage flag
if (args.includes('--no-coverage')) {
  TEST_CONFIG.coverage = false;
}

// Handle bail flag
if (args.includes('--bail')) {
  TEST_CONFIG.bail = true;
}

// Run the tests
main().catch(error => {
  log(`Unexpected error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});