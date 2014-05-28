var winston = require('winston');


module.exports = function $injected($config) {
  var log = {};

  log.gaia = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({colorize: 'true', timestamp: true})
    ]
  });

  log.app = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)($config.log || {colorize: 'true', timestamp: true})
    ]
  });


  return log;
};
