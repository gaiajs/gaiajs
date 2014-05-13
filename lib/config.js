var path = require('path'),
	fs = require('fs'),
	_ = require('underscore');

exports = module.exports = new Config();


var isInitialized = false;
var listOfFile = [
	{name: 'application', require: true},
	{name: 'database', require:true, 'normalize': normalizeDatabaseConfig},
	{name: 'route', require: true, 'normalize': normalizeRouteConfig},
	{name: 'authentification', require: false},
	{name: 'filters', require: false},
	{name: 'log', require: false}
];


function Config() {
	this.env = process.env.NODE_ENV || 'development';
	
}

Config.prototype._initialize = function(appDir) {
	if (isInitialized) return;
	this.appDir = appDir;
	var configPath = path.resolve(appDir, 'config/', this.env);
	if (!fs.existsSync(configPath)) {
		throw new Error("The folder " + configPath + " does not exist");
	}


	listOfFile.forEach(function(file) {
		try {

			var conf = require(path.resolve(configPath, file.name + '.js'));
			if (file.normalize) conf = file.normalize(conf);
			this[file.name] = conf;
		} catch(err) {
			if (file.hasOwnProperty('require') && file.require) {
				throw new Error(err);
			}
		}
	}, this);
	isInitialized = true;
	Object.seal(this);
};

function normalizeDatabaseConfig(config) {
	if (!config) return config;
	if (config.databaseSchema) {
		for (var databaseSchemaName in config.databaseSchema) {
			var databaseSchema = config.databaseSchema[databaseSchemaName];
			if (_.isString(databaseSchema)) {
				databaseSchema = {
					databaseName: databaseSchemaName,
					dir: databaseSchemaName
				}
			} else {
				databaseSchema.databaseName = databaseSchema.databaseName || databaseSchema;
				databaseSchema.dir = databaseSchema.dir || databaseSchema;
				
			}
			config.databaseSchema[databaseSchemaName] = databaseSchema;
		}
	} else {
		config.databaseSchema = {
			'default': {
				dir: '.',
				databaseName: config.database
			}
		};

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