module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  testPathIgnorePatterns: [
    "/lib/",
    "/node_modules/",
    "/build/",
    "/build-types/",
    "/_data",
    "/_helpers",
    "/_scenarios",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  testEnvironment: "node",
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  collectCoverageFrom: [
    "src/core/**",
    "src/utils/**",
    "!src/utils/**/auth-middleware.ts",
    "!src/utils/**/redis-client.ts",
    "!src/utils/**/redis-middleware.ts",
  ],
};
