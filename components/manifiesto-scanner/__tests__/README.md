# Manifiesto Scanner Integration Test Suite

This directory contains comprehensive integration tests for the Manifiesto Scanner feature, covering end-to-end workflows, browser compatibility, mobile/desktop responsiveness, and accuracy validation.

## Test Structure

### 1. End-to-End Integration Tests (`EndToEnd.integration.test.tsx`)
Tests the complete workflow from image upload to data export:
- **Complete Workflow**: Image upload → OCR processing → Data parsing → Manual editing → Review & save
- **Error Handling**: OCR failures, parsing errors, storage issues
- **Data Export**: CSV and JSON export functionality
- **Performance**: Processing time limits and concurrent operations

### 2. Browser Compatibility Tests (`BrowserCompatibility.integration.test.tsx`)
Validates functionality across different browsers and their capabilities:
- **Supported Browsers**: Chrome, Firefox, Safari, Edge, IE11
- **Feature Detection**: WebWorkers, IndexedDB, WebP support, Canvas API
- **Graceful Degradation**: Fallbacks for missing features
- **Performance Optimization**: Browser-specific optimizations

### 3. Mobile/Desktop Compatibility Tests (`MobileDesktop.integration.test.tsx`)
Tests responsive design and device-specific functionality:
- **Device Types**: Mobile phones, tablets, desktops, hybrid devices
- **Input Methods**: Touch, mouse, keyboard navigation
- **Responsive Layout**: Breakpoints and orientation changes
- **Device Features**: Camera access, file system, storage constraints

### 4. Accuracy Validation Tests (`AccuracyValidation.integration.test.tsx`)
Compares OCR extraction accuracy against manual input benchmarks:
- **Perfect OCR Scenarios**: High-quality image processing
- **OCR Error Handling**: Common OCR mistakes and corrections
- **Manual vs Automated**: Accuracy comparison metrics
- **Field-Specific Analysis**: Critical field accuracy tracking

## Sample Data

The test suite uses real manifiesto samples located in `.kiro/specs/manifiesto-scanner/Manifiestos/`:

- `sample-manifiesto-1.txt`: Complete, high-quality manifiesto (Aeroméxico)
- `sample-manifiesto-2.txt`: Complete manifiesto with different format (Volaris)
- `sample-manifiesto-incomplete.txt`: Incomplete/damaged manifiesto for error testing

## Running Tests

### All Integration Tests
```bash
npm run test:integration
```

### Specific Test Suites
```bash
# End-to-end workflow tests
npm run test:e2e

# Browser compatibility tests
npm run test:browser

# Mobile/desktop compatibility tests
npm run test:mobile

# Accuracy validation tests
npm run test:accuracy

# Performance tests
npm run test:performance
```

### Watch Mode
```bash
npm run test:integration:watch
```

### Custom Patterns
```bash
# Run specific test file
npm test -- --testPathPattern="EndToEnd.integration.test.tsx"

# Run tests matching pattern
npm test -- --testPathPattern=".*integration.*" --verbose
```

## Test Configuration

### Timeouts
- Unit tests: 10-15 seconds
- Integration tests: 60 seconds
- Performance tests: May require longer timeouts

### Coverage Thresholds
- Branches: 70%
- Functions: 75%
- Lines: 80%
- Statements: 80%

### Browser Configurations
Tests simulate various browser environments:
- **Chrome Desktop**: Full feature support
- **Firefox Desktop**: Full feature support
- **Safari Desktop**: Limited WebP support
- **Edge Desktop**: Full feature support
- **Chrome Mobile**: Limited WebGL, memory constraints
- **Safari Mobile**: No WebP, iOS restrictions
- **IE11**: Legacy support, limited features
- **Legacy Browser**: Minimal feature support

### Device Configurations
Tests cover various device types:
- **Mobile Phones**: iPhone SE, iPhone 12 Pro, Samsung Galaxy S21, Budget Android
- **Tablets**: iPad, Android Tablet
- **Desktops**: Various screen sizes and input methods
- **Hybrid Devices**: Surface Pro with touch and keyboard

## Accuracy Metrics

The test suite calculates several accuracy metrics:

### Overall Accuracy
Percentage of correctly extracted fields across all data points.

### Critical Field Accuracy
Accuracy for essential fields like flight number, date, airline, origin/destination.

### Numeric Accuracy
Accuracy for numeric fields (passenger counts, cargo weights, times).

### Text Accuracy
Accuracy for text fields using Levenshtein distance for fuzzy matching.

### Completeness
Percentage of fields that contain data (not null/undefined).

## Expected Accuracy Benchmarks

### Production Thresholds
- Overall accuracy: >85%
- Critical field accuracy: >90%
- Numeric accuracy: >95%
- Field completeness: >80%

### OCR Confidence Levels
- High confidence (>0.90): Expected >95% accuracy
- Medium confidence (0.70-0.90): Expected >80% accuracy
- Low confidence (<0.70): Manual review recommended

## Error Scenarios Tested

### OCR Errors
- Character confusion (O/0, I/1, É/E)
- Missing accents and special characters
- Decimal separator variations
- Time format inconsistencies

### Parsing Errors
- Unrecognized manifiesto formats
- Missing required fields
- Inconsistent data structures
- Corrupted text input

### System Errors
- Storage quota exceeded
- Network connectivity issues
- Browser feature unavailability
- Memory constraints

## Performance Benchmarks

### Processing Time Limits
- Small images (<1MB): <3 seconds
- Medium images (1-3MB): <5 seconds
- Large images (>3MB): <8 seconds
- Batch processing: <2 seconds per image

### Memory Usage
- Single image processing: <50MB peak
- Batch processing: <100MB peak
- Storage per manifiesto: <1MB

### Browser Performance
- Desktop browsers: Baseline performance
- Mobile browsers: 1.5-2x slower acceptable
- Legacy browsers: 2-3x slower acceptable

## Troubleshooting

### Common Issues

#### Test Timeouts
- Increase timeout in jest.config.js
- Check for infinite loops or unresolved promises
- Verify mock implementations

#### Mock Failures
- Ensure all external dependencies are mocked
- Check mock return values match expected types
- Verify async mock behavior

#### Browser Compatibility Issues
- Update browser feature detection logic
- Add new fallback mechanisms
- Test with actual browser environments

#### Accuracy Issues
- Review OCR processing parameters
- Update parsing regex patterns
- Validate sample manifiesto data

### Debug Commands
```bash
# Run with verbose output
npm run test:integration -- --verbose

# Run specific test with debugging
npm test -- --testPathPattern="EndToEnd" --verbose --no-cache

# Generate coverage report
npm run test:integration -- --coverage

# Run with specific timeout
npm test -- --testTimeout=120000
```

## Contributing

When adding new integration tests:

1. **Follow Naming Convention**: `*.integration.test.tsx`
2. **Use Descriptive Test Names**: Clearly describe what is being tested
3. **Mock External Dependencies**: Ensure tests are isolated and repeatable
4. **Add Performance Benchmarks**: Include timing expectations
5. **Document Expected Behavior**: Add comments explaining complex test logic
6. **Update Sample Data**: Add new manifiesto samples if needed

### Test Categories
- **Workflow Tests**: Complete user journeys
- **Compatibility Tests**: Cross-browser/device functionality
- **Accuracy Tests**: Data extraction validation
- **Performance Tests**: Speed and resource usage
- **Error Tests**: Failure scenarios and recovery

### Best Practices
- Use realistic test data
- Test both success and failure paths
- Include edge cases and boundary conditions
- Verify accessibility features
- Test with various image qualities and formats
- Validate responsive behavior across breakpoints

## Continuous Integration

The integration test suite is designed to run in CI/CD environments:

- **Parallel Execution**: Tests can run concurrently
- **Deterministic Results**: Mocked dependencies ensure consistent results
- **Resource Management**: Memory and timeout limits prevent CI failures
- **Detailed Reporting**: JSON reports for CI integration
- **Coverage Tracking**: Integration with coverage tools

## Reporting

Test results are automatically generated in `test-reports/`:
- **Summary Report**: Pass/fail counts and timing
- **Detailed Results**: Individual test outcomes
- **Coverage Report**: Code coverage metrics
- **Performance Metrics**: Processing time analysis
- **Accuracy Analysis**: Field-by-field accuracy breakdown