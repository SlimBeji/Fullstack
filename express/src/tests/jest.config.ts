import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
    preset: "ts-jest",
    testEnvironment: "node",
    modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/build/"],
    testMatch: ["**/*.test.ts"],
    collectCoverage: false,
    coverageDirectory: "coverage",
};

export default config;
