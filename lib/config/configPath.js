var path = require('path');

exports = module.exports = ConfigPath;

function ConfigPath() {};

ConfigPath.prototype.initialize = function(options) {
    options = options || {};
    this.appDir = options.appDir || process.env.GAIAJS_APP_DIR || path.dirname(process.mainModule.filename);

    if (options.configDir) {
        this.configDir = path.resolve(this.appDir, options.configDir);
    } else {
        this.configDir = process.env.GAIAJS_CONFIG_DIR ||  path.resolve(this.appDir, "./config");
    }

    if (options.publicDir) {
        this.publicDir = path.resolve(this.appDir, options.publicDir);
    } else {
        this.publicDir = process.env.GAIAJS_PUBLIC_DIR ||  path.resolve(this.appDir, "./public");
    }

    if (options.viewsDir) {
        this.viewsDir = path.resolve(this.appDir, options.viewsDir);
    } else {
        this.viewsDir = process.env.GAIAJS_PVIEWS_DIR ||  path.resolve(this.appDir, "./views");
    }

};
