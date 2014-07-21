/********************************
 ** Module dependencies
 ********************************/
var path = require('path'),
    thunkify = require('thunkify'),
    glob = thunkify(require("glob"));


exports = module.exports = function $inject($configPath, $injector) {
    return {

        /**
         * Get all module on folder and subfolder of app and type
         * All module are passed on injector
         * return list of module
         */
        getModules: function * getModules(type) {
            var filePath = path.resolve($configPath.appDir, 'app/' + type),
                modules = {},
                files = yield glob(filePath + '/**/*.js', {});

            files.forEach(function(file) {
                if (~file.indexOf('.js')) {
                    var basename = file.replace(filePath + '', "");
                    basename = basename.substr(1, basename.length - 4);
                    modules[basename] = $injector.processInject(require(file));
                }
            });
            return modules;
        }
    };
};
