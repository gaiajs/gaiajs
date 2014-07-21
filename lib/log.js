/********************************
 ** Module dependencies
 ********************************/
var winston = require('winston'),
    debug = require('debug')('gaia.log');


exports = module.exports = function $inject($config) {
    debug('initialize logger');

    return new(winston.Logger)({
        transports: [
            new(winston.transports.Console)($config.log || {
                colorize: 'true',
                timestamp: true
            })
        ]
    });
};

exports.defaultLogger = function() {
    return new(winston.Logger)({
        transports: [
            new(winston.transports.Console)({
                colorize: 'true',
                timestamp: true
            })
        ]
    });
};
