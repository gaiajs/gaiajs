/********************************
 ** Module dependencies
 ********************************/
var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    yaml = require('js-yaml'),
    thunkify = require('thunkify'),
    glob = thunkify(require("glob")),
    debug = require('debug')('gaia.config');

exports = module.exports = new Config();

/********************************
 ** Configurarition
 ********************************/
var isInitialized = false;
const filesConfig = [
  {name: 'application', require: true},
  {name: 'database', require:false, 'normalizer': require('./normalizers/databaseNormalizer')},
  {name: 'route', require: true, 'normalizer': require('./normalizers/routeNormalizer')},
  {name: 'authentification', require: false},
  {name: 'filters', require: false},
  {name: 'log', require: false},
  {name: 'generator', require: false, 'normalizer': require('./normalizers/generatorNormalizer')}
];
const listAuthorizeExtension = ['.js', '.json', '.yml'];


/********************************
  ** Class
  ********************************/
function Config() {
  if (isInitialized) throw new Error("Config can't be instanciate");
  this.env = process.env.NODE_ENV || 'development';
}

/**
 * Initialize config
 */
Config.prototype.initialize = function *(appDir) {
  debug('Initialize config');
  if (isInitialized) return;
  this.appDir = appDir;

  //load all config in development folder
  yield this._loadConfig('development');

  //if env != development, load and override configuration
  if ('development' !== this.env) yield this._loadConfig(this.env);
  this._validConf();
  isInitialized = true;
  Object.freeze(this);
};

/**
 * Validate configuration
 */
Config.prototype._validConf = function() {
//assert if all mandatory files are loaded
  var filesRequired = _.where(filesConfig, {require: true});
  var hasError = false;
  filesRequired.forEach(function(file) {
    if (!this[file.name]) {
      console.error("Configuration file %s is mandatory", file.name);
      hasError = true;
    }
  }, this);

  if (hasError) throw new Error("Missing configuration file");
};

/**
 * Load configuration
 */
Config.prototype._loadConfig = function *(env) {
  var configPath = path.resolve(this.appDir, 'config/', env);
  if (!fs.existsSync(configPath)) {
    throw new Error("The folder " + configPath + " does not exist");
  }

  var files = yield getFilesOfPath(configPath);
  for (var k in files) {

    var file = files [k],
        ext = path.extname(file),
        fileName = path.basename(file, ext),
        fileConfig = _.findWhere(filesConfig, {name: fileName}) || {};
        isRequireFile = fileConfig.hasOwnProperty('require') && fileConfig.require;

    debug('load file config: %s%s', fileName, ext);

    if (-1 === _.indexOf(listAuthorizeExtension, ext)) continue;

    try {
      var conf = getFileContent(ext, file);

      if (fileConfig.normalizer) conf = fileConfig.normalizer(conf);
      this[fileName] = conf;
    } catch (err) {
      console.warn("error on file", fileName, " erreur :", err);
      if (fileConfig.hasOwnProperty('require') && fileConfig.require) {
        console.error("error on file", fileName, " erreur :", err);
        throw new Error(err);
      }
    }
  }
};


/**
 * Get file content
 *
 */
function getFileContent(ext, file) {
  var conf = {};
  switch (ext){
  case '.js':
    conf = require(file);
    break;
  case '.json':
    conf = JSON.parse(fs.readFileSync(file, {encoding: 'utf-8'}));
    break;
  case '.yml':
    conf = yaml.safeLoad(fs.readFileSync(file, {encoding: 'utf-8'}));
    break;
  }

  return conf;
}

/**
 * Get all files in folder and subfolder
 */
function *getFilesOfPath(folder) {
  return yield glob(folder + '/**/*', {});
}
