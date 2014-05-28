var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    yaml = require('js-yaml'),
    thunkify = require('thunkify'),
    glob = thunkify(require("glob"));

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
  {name: 'log', require: false}
];
const listAuthorizeExtension = ['.js', '.json', '.yml'];


/********************************
  ** Class
  ********************************/
function Config() {
  if (isInitialized) throw new Error("Config can't be instanciate");
  this.env = process.env.NODE_ENV || 'development';
}

Config.prototype.initialize = function *(appDir) {
  if (isInitialized) return;
  this.appDir = appDir;
  yield this._loadConfig('development');
  if ('development' !== this.env) yield this._loadConfig(this.env);
  isInitialized = true;
  Object.freeze(this);
};

Config.prototype._loadConfig = function *(env) {
  var configPath = path.resolve(this.appDir, 'config/', env);
  if (!fs.existsSync(configPath)) {
    throw new Error("The folder " + configPath + " does not exist");
  }

  var files = yield getFilesOfPath(configPath);
  var loadedFiles = [];
  for (var k in files) {

    var file = files [k],
        ext = path.extname(file),
        fileName = path.basename(file, ext),
        fileConfig = _.findWhere(filesConfig, {name: fileName}) || {};
        isRequireFile = fileConfig.hasOwnProperty('require') && fileConfig.require;

    if (-1 === _.indexOf(listAuthorizeExtension, ext)) continue;

    try {
      var conf = getFileContent(ext, file);

      if (fileConfig.normalizer) conf = fileConfig.normalizer(conf);
      loadedFiles.push(fileName);
      this[fileName] = conf;
    } catch (err) {
      console.warn("error on file", file.name, " erreur :", err);
      if (fileConfig.hasOwnProperty('require') && fileConfig.require) {
        console.error("error on file", file.name, " erreur :", err);
        throw new Error(err);
      }
    }
  }

  //assert if all mandatory files are loaded
  var filesRequired = _.where(filesConfig, {require: true});
  var hasError = false;
  filesRequired.forEach(function(file) {
    if (!_.contains(loadedFiles, file.name)) {
      console.error("Configuration file %s is mandatory", file.name);
      hasError = true;
    }
  });

  if (hasError) throw new Error("Missing configuration file");
};

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

function *getFilesOfPath(folder) {
  return yield glob(folder + '/**/*', {});
}
