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
  moduleNameMapper: {
    // @thallesp/nestjs-better-auth is ESM-only (`import.meta.url`) and unparsable by CJS Jest, so it's stubbed here.
    '^@thallesp/nestjs-better-auth$': '<rootDir>/src/testing/mocks/thallesp-nestjs-better-auth.mock.ts',
    // @arcjet/nest is ESM-only (no CJS build) and unparsable by CJS Jest, so it's stubbed here.
    '^@arcjet/nest$': '<rootDir>/src/testing/mocks/arcjet-nest.mock.ts',
  },
  coverageDirectory: '../../coverage/apps/api',

  collectCoverage: true,

  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/testing/**'],

  coverageReporters: ['text', 'html', 'lcov'],
};
