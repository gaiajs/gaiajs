var assert = require('assert');

exports = module.exports = function normalizeGeneratorConfig(config) {
  if (!config) return config;

  if (!config.path) config.path = '/';



  return config;
};

function validateConfig(generatorConfig) {
  assert(generatorConfig.basePath);
  assert(generatorConfig.models);
  assert(Array.isArray(generatorConfig.models));
}
