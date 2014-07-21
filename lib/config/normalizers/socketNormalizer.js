var _ = require('underscore');

exports = module.exports = function normalizeDatabaseConfig(config) {
    if (!config || !config.socket) return;

    if (_.isString(config.socket)) {
        config.socket = require(config.socket);
    }

    return config.socket;
};
