const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Keep resolution inside betting_mobile so the parent Next.js node_modules
// does not break Expo package lookups.
config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
