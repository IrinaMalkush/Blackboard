export {};
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/src/__test__/setupTests.ts"],
  // setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/src/__test__/fileMock.js",
    "\\.(css|less)$": "identity-obj-proxy",
    "@components/(.*)$": "<rootDir>/src/components/$1",
    "@/(.*)$": "<rootDir>/src/$1",
  },
};
