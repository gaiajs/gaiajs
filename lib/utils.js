var path = require('path'),
		thunkify = require('thunkify'),
		glob = thunkify(require("glob"));



exports = module.exports = function(config) {
	return {
		getModules: function *(type) {
			var filePath = path.resolve(config.appDir, 'app/' + type),
					modules = {},
					files = yield glob(filePath + '/**/*.js', {});

			files.forEach(function (file) {
				if (~file.indexOf('.js')) {
					var basename = file.replace(filePath  + '', "");
					basename = basename.substr(1, basename.length - 4);
					modules[basename] = require(file);
				}
			});
			return modules;
		}
	}
}
