/********************************
 ** Module dependencies
 ********************************/
var _ = require('underscore'),
    path = require('path');

exports = module.exports = function $inject($configPath) {
    return function normalizeAuthentification(file, config) {
        if (!config) return config;
        
        if (_.isString(config)) {
            config = require(path.resolve($configPath.appDir, config));
        }
        return config;
    }
};
