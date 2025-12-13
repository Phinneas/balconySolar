module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    '__tests__/**/*.js',
    '!__tests__/**/*.test.js',
  ],
};
