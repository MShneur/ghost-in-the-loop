module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/tests/v9-'],
  setupFiles: ['./tests/setup.js'],
  coverageReporters: ['text','lcov']
};
