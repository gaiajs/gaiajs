/********************************
 ** Module dependencies
 ********************************/
var _ = require('underscore'),
    path = require('path'),
    utils = require('../../utils'),
    assert = require('assert');


/********************************
 ** Default configuration
 ********************************/
var defaultConfig = {
    dir: '.',
    default: false,
};


/**
 * Normalize configuration and validate
 */
exports = module.exports = function $inject($configPath) {
    return function normalizeDatabaseConfig(file, config) {
        if (!config) return config;

        //make array of persistences (if there is one persistence)
        if (!config.persistences) {
            config.name = config.name || 'default';
            config = {
                persistences: [config]
            };
        }

        var hasDefault = false;
        for (var k in config.persistences) {
            var persistence = _.defaults({}, config.persistences[k], defaultConfig);

            //if persistence has property default
            if (persistence.hasOwnProperty('default')) {
                if (persistence.default && hasDefault) {
                    throw new Error("Can't have more than 1 persistence with default");
                }
                if (persistence.default) hasDefault = true;
            } else {
                persistence.default = false;
            }

            if (persistence.hasOwnProperty('onRun') && _.isString(persistence.onRun)) {
                persistence.onRun = require(path.resolve($configPath.appDir, persistence.onRun));
            }

            persistence.options = persistence.options || {};
            validatePersitence(persistence);
            config.persistences[k] = persistence;
        }

        if (!hasDefault) {
            var defaultPersistence = config.persistences[0];
            config.persistences[0].default = true;
        }

        return config;
    }
};


/**
 * Validator
 */
function validatePersitence(persistence) {
    assert(persistence.name, "[Database config] name of persistence is mandatory");
    assert(persistence.dir, "[Database config] dir of models is mandatory [" + persistence.name + " persistence]");
    assert(persistence.hasOwnProperty('default'));
    assert(!persistence.hasOwnProperty('onFirstRun') || (persistence.hasOwnProperty('onFirstRun') && _.isFunction(persistence.onFirstRun)), "[Database config] onFirstRun must be a function  [" + persistence.name + " persistence]");
    assert(persistence.driver, "[Database config] driver is mandatory  [" + persistence.name + " persistence]");
}
