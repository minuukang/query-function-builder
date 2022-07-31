const path = require("path");
module.exports = {
  verbose: false,
  testEnvironment: "jsdom",
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsconfig: path.join(__dirname, "./tsconfig.test.json"),
      diagnostics: false,
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  testRegex: "(test|spec)\\.tsx?$",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  setupFilesAfterEnv: [path.join(__dirname, "./setup-jest.js")],
  transformIgnorePatterns: ["../node_modules/"],
  coverageDirectory: "coverage",
  coverageReporters: ["cobertura"],
  automock: false,
};
