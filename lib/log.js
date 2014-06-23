/********************************
 ** Module dependencies
 ********************************/
var winston = require('winston'),
    debug = require('debug')('gaia.log');


module.exports = function $inject($config) {
  debug('initialize logger');
  var log = {};

  log.app = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)($config.log || {colorize: 'true', timestamp: true})
    ]
  });


  return log;
};
