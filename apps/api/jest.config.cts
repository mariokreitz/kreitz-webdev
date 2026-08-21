module.exports = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        astTransformers: { before: ['<rootDir>/tools/swagger-plugin-transformer.js'] },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',

  collectCoverage: true,

  collectCoverageFrom: ['src/core/logging/request-id.middleware.ts', 'src/core/logging/utils/sanitize.ts'],

  coverageReporters: ['text', 'html', 'lcov'],

  coverageThreshold: {
    global: {
      statements: 100,
      lines: 100,
      functions: 100,
      branches: 100,
    },
  },
};
