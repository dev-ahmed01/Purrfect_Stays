module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@purrfect/contracts
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.controller.ts',
    '!src/**/*.decorator.ts',
  ],
  coverageDirectory: 'coverage',
};
: '<rootDir>/../../packages/contracts/src/index.ts',
    '^@purrfect/database
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.controller.ts',
    '!src/**/*.decorator.ts',
  ],
  coverageDirectory: 'coverage',
};
: '<rootDir>/../../packages/database/src/index.ts',
    '^(\\.{1,2}/.*)\\.js
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.controller.ts',
    '!src/**/*.decorator.ts',
  ],
  coverageDirectory: 'coverage',
};
: '$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.controller.ts',
    '!src/**/*.decorator.ts',
  ],
  coverageDirectory: 'coverage',
};
