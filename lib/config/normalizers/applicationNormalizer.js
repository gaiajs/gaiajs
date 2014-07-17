/********************************
 ** Module dependencies
 ********************************/
var assert = require('assert');

exports = module.exports = function normalizeApplicationConfig(config) {
  if (!config) return config;

  assert(config.port, "[Application config] port is mandatory");

  return config;
};
