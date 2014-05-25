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
	{name: 'database', require:true, 'normalizer': normalizeDatabaseConfig},
	{name: 'route', require: true, 'normalizer': normalizeRouteConfig},
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
	Object.seal(this);
};

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

		if (-1 === _.indexOf(listAuthorizeExtension, ext)) continue;

		try {
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

			if (fileConfig.normalizer) conf = fileConfig.normalizer(conf);
			this[fileName] = conf;
		} catch (err) {
			console.warn("error on file", file.name, " erreur :", err);
			if (fileConfig.hasOwnProperty('require') && fileConfig.require) {
				console.error("error on file", file.name, " erreur :", err);
				throw new Error(err);
			}
		}
	}
}



function normalizeDatabaseConfig(config) {
	if (!config) return config;
	if (config.databaseSchema) {
		for (var databaseSchemaName in config.databaseSchema) {
			var databaseSchema = config.databaseSchema[databaseSchemaName];
			if (!_.isObject(databaseSchema)) {
				throw new Error("The schema conf " + databaseSchemaName + " is incorrect !");
			}

			if (!databaseSchema.connection || !config.connections[databaseSchema.connection]) {
				throw new Error("The connection of schema " + databaseSchemaName + " is incorrect !");
			}
			databaseSchema.databaseName = databaseSchema.databaseName || databaseSchemaName;
			databaseSchema.dir = databaseSchema.dir || databaseSchemaName;
			databaseSchema.isGenerator = databaseSchema.isGenerator || false;
			databaseSchema.default = databaseSchema.default || false;
			config.databaseSchema[databaseSchemaName] = databaseSchema;
		}
	} else {
		var firstConnection = Object.keys(config.connections)[0];
		config.databaseSchema = {
			'default': {
				dir: '.',
				connection: firstConnection,
				isGenerator: false,
				"default": true,
				databaseName: config.connections[firstConnection].databaseName
			}
		};

		if (config.collectionTestForFirstRun) {
			config.databaseSchema['default'].collectionTestForFirstRun = config.collectionTestForFirstRun;
		}

		if (config.onFirstRun) {
			config.databaseSchema['default'].onFirstRun = config.onFirstRun;
		}

	}
	return config;
}

function normalizeRouteConfig(config) {
	if (!config) return config;
	var methodRegex = /^(post|get|put|delete) (.*)/i;
	var controllerRegex = /([^#]*)#(.*)/;
	var newConfig = [];
	for (var p in config) {
		var routeConfig = config[p];
		delete config[p];
		if (!routeConfig) continue;

		var conf;
		if ("string" === typeof routeConfig) {
			conf = {
				method: 'get',
				controller: routeConfig
			};
		} else {
			conf = routeConfig;
		}

		var matches = p.match(methodRegex);
		if (null != matches) {
			conf.method = matches[1].toLowerCase();
			p = matches[2];
		}

		matches = conf.controller.match(controllerRegex);
		if (null != matches) {
			conf.controller = matches[1];
			conf.action = matches[2];
		}
		conf.path = p;
		newConfig.push(conf);
	}

	return newConfig;
}


function *getFilesOfPath(folder) {
	return yield glob(folder + '/**/*', {});
}
