const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude supabase migrations, functions, and heavy build folders from Metro file watcher
config.resolver.blocklist = [
  /supabase\/.*/,
  /\.git\/.*/,
];

module.exports = config;
