export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1'
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['esbuild-jest', {
      sourcemap: true,
      target: 'es2020'
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-window|@chakra-ui|framer-motion)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.jsx',
    '!src/setupTests.js',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/test/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/components/': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/hooks/': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/utils/': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/cypress/'
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  globals: {
    __DEV__: true,
    __PROD__: false
  },
  setupFiles: ['<rootDir>/src/jest.polyfills.js'],
  testTimeout: 10000,
  maxWorkers: '50%',
  clearMocks: true,
  restoreMocks: true
}