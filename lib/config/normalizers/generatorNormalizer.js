/********************************
 ** Module dependencies
 ********************************/
var assert = require('assert');

exports = module.exports = function normalizeGeneratorConfig(config) {
    if (!config) return config;

    validateConfig(config);
    return config;
};

function validateConfig(generatorConfig) {
    assert(generatorConfig.models, "[Generator config] the list of models is mandatory when you activate generator of rest");
    assert(Array.isArray(generatorConfig.models), "[Generator config] models must be an array");
}
