const path = require('path');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  const absoluteWin = path.join(__dirname, 'node_modules', 'metro-runtime', 'src', 'modules', 'empty-module.js');
  const absoluteUnix = absoluteWin.replace(/\\/g, '/');

  config.resolve = config.resolve || {};
  config.resolve.alias = config.resolve.alias || {};

  // Alias several possible specifier forms the bundler might try to resolve
  config.resolve.alias[absoluteWin] = absoluteWin;
  config.resolve.alias[absoluteUnix] = absoluteWin;
  config.resolve.alias['metro-runtime/src/modules/empty-module.js'] = absoluteWin;

  return config;
};
