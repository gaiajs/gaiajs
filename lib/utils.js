var config = require('./config'),
	path = require('path'),
	thunkify = require('thunkify'),
	glob = thunkify(require("glob"));


/**
 * Get instance of modules
 *
 */
exports.getModules = function *(type) {
	var filePath = path.resolve(config.appDir, 'app/' + type);
	var modules = {};

	var files = yield glob(filePath + '/**/*.js', {});

	files.forEach(function (file) {
		if (~file.indexOf('.js')) {
			var basename = file.replace(filePath  + '', "");
			basename = basename.substr(1, basename.length - 4);
			modules[basename] = require(file);
		}
	});
	return modules;
}