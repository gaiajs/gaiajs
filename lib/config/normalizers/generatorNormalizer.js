var assert = require('assert');

exports = module.exports = function normalizeGeneratorConfig(config) {
  if (!config || !config.models) return config;

  validateConfig(config);
  return config;
};

function validateConfig(generatorConfig) {
  assert(generatorConfig.models);
  assert(Array.isArray(generatorConfig.models));
}
