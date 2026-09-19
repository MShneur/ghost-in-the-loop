module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/v9-*.test.js',
    '**/version.test.js',
    '**/build-identity.test.js',
    '**/package-candidate.test.js'
  ],
  coverageReporters: ['text','lcov']
};
