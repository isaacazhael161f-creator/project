module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/'],
  // Global test timeout for integration tests
  testTimeout: 30000,
  // Separate configs for different test types
  projects: [
    {
      displayName: 'utilities',
      testMatch: ['<rootDir>/utils/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      testTimeout: 10000
    },
    {
      displayName: 'hooks',
      testMatch: ['<rootDir>/hooks/**/*.test.ts'],
      preset: 'jest-expo',
      setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
      ],
      testTimeout: 15000
    },
    {
      displayName: 'components',
      testMatch: ['<rootDir>/components/**/*.test.tsx'],
      preset: 'jest-expo',
      setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
      ],
      testTimeout: 20000
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/**/*.integration.test.{ts,tsx}'],
      preset: 'jest-expo',
      setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
      ],
      testTimeout: 60000, // Longer timeout for integration tests
      maxWorkers: 2, // Limit workers for integration tests to avoid resource conflicts
      // Additional setup for integration tests
      setupFiles: ['<rootDir>/jest.integration.setup.js'],
      // Coverage settings for integration tests
      collectCoverageFrom: [
        '<rootDir>/components/manifiesto-scanner/**/*.{ts,tsx}',
        '<rootDir>/utils/manifiesto/**/*.{ts,tsx}',
        '<rootDir>/hooks/**/*.{ts,tsx}',
        '<rootDir>/stores/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/__tests__/**',
        '!**/node_modules/**'
      ],
      coverageDirectory: '<rootDir>/coverage/integration',
      coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
      coverageThreshold: {
        global: {
          branches: 70,
          functions: 75,
          lines: 80,
          statements: 80
        }
      }
    }
  ]
};