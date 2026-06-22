import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@mailscope/utils$': '<rootDir>/../../packages/utils/src/index.ts',
  },
};

export default config;
