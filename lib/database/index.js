var path = require('path'),
		thunkify = require('thunkify'),
		glob = thunkify(require("glob")),
		S = require('string'),
		Persistence = require('./persistence'),
		util = require('util');

var cachePersistences = {},
		defaultPersistence = null,
		isInit = false;

function Database($config, $injector){
	this.$config = $config;
	this.$injector = $injector;
	if (!(this instanceof Database)) return new Database($config, $injector);
}

Database.$injected = true;

Database.prototype.init = function *() {
	if (isInit) throw new Error("Database is already initialize");
	for (var k in this.$config.database.persistences) {
		var persistence = this.$config.database.persistences[k],
				name = normalize(persistence.name),
				driver = require(persistence.driver);

		//register the persistence
		this.$injector.register('$' + name + 'Persistence', {native: driver.native});

		//if current persistence is the default persistence. Register with name $persistence
		if (persistence.default) this.$injector.register('$persistence', {native: driver.native});

	  var models =  yield this.getModels(persistence.dir);

		var persistenceDefinition = yield driver.getPersistenceDefinition(persistence.connection, models);

		cachePersistences[name] = Persistence(persistenceDefinition, models, persistence.default);

		this.$injector.register('$' + name + 'Persistence', cachePersistences[name]);
		if (persistence.default) this.$injector.register('$persistence', cachePersistences[name]);

		if (persistenceDefinition.repositories && 1 === this.$config.database.persistences.length) {
			for (var repoName in persistenceDefinition.repositories) {
				this.$injector.register('$' + repoName + 'Repository', persistenceDefinition.repositories[repoName]);
			}
		}

		if (persistence.collectionTestForFirstRun && persistence.onFirstRun) {
			var obj = persistenceDefinition.repositories[persistence.collectionTestForFirstRun];
			var objs = yield obj.find().exec();
			if (!objs || !objs.length) yield persistence.onFirstRun(persistenceDefinition.repositories);
		}
	}

	Object.freeze(this);
};

Database.prototype.getPersistences = function() {
	return cachePersistences;
};

Database.prototype.getPersistence = function(persistenceName) {
	if (!persistenceName) return defaultPersistence;

	return cachePersistences[persistenceName];
};

Database.prototype.getModels = function *(modelsDir) {
	var appDir =  this.$config.appDir,
			modelsPath = path.resolve(appDir, 'app/models', modelsDir) + '/**/*.js',
			files = yield glob(modelsPath, {}),
			models = [];

	files.forEach(function (file) {
		if (~file.indexOf('.js')) {
			models.push({
				name: normalize(path.basename(file, '.js')),
				schema: this.$injector.processInject(require(path.resolve(appDir, 'app/models', modelsDir, file)))
			});
		}
	}, this);
	return models;
};

function normalize(string) {
	return S(string.substr(0,1).toLowerCase() + string.substring(1)).camelize().s;
}

exports = module.exports = Database;
