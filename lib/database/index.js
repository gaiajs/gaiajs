var config = require('../config');
var database;
switch (config.database.driver) {
	case 'mongoose':
	default:
		database = require('gaia-driver-mongoose');
}
exports = module.exports = database;
