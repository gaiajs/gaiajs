var config = require('./config'),
	winston = require('winston');


exports.gaia = new (winston.Logger)({
	transports: [
	  new (winston.transports.Console)({colorize: 'true', timestamp: true})
	]
});

exports.app = new (winston.Logger)({
	transports: [
	  new (winston.transports.Console)(config.log || {colorize: 'true', timestamp: true})
	]
});