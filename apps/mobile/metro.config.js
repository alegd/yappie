/* eslint-disable @typescript-eslint/no-require-imports */
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

config.resolver = config.resolver || {};
const previousBlockList = config.resolver.blockList;
const testPattern = /.*\.spec\.(ts|tsx|js|jsx)$/;
config.resolver.blockList = Array.isArray(previousBlockList)
  ? [...previousBlockList, testPattern]
  : previousBlockList
    ? [previousBlockList, testPattern]
    : [testPattern];

module.exports = config;
