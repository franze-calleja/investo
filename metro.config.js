const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Point to the actual global stylesheet under app/ so Metro finds it.
module.exports = withNativeWind(config, { input: "./app/global.css" });