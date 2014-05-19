var config = require('./config'),
	thunkify = require('thunkify'),
	locals = require('koa-locals'),
	path = require('path'),
	fs = require("fs");


module.exports = function (gaia) {
	var localsPath = path.resolve(config.appDir, 'app/locals');
	var exist = fs.existsSync(localsPath);

	var _locals = {
		__gaia: 'Gaia application'
	};
	console.log('exist : ', exist);
	if (exist) {

	}

	locals(gaia._app, _locals);
}