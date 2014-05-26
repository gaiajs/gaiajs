var config = require('../config'),
		path = require('path'),
		thunkify = require('thunkify'),
		glob = thunkify(require("glob")),
		S = require('string'),
		Persistence = require('./persistence');

var util = require('util');

var cachePersistences = {},
		defaultPersistence = null,
		isInit = false;

function Database(){
	if (!(this instanceof Database)) return new Database();
}


Database.prototype.init = function *(){
	if (isInit) throw new Error("Database is already initialize");

	for (var k in config.database.persistences) {
		var persistence = config.database.persistences[k],
				name = persistence.name,
				driver = require(persistence.driver);

		//expose global api of driver
		GLOBAL.Database[driver.native.name] = this[driver.native.name] = driver.native.api;

	  var models =  yield getModels(persistence.dir);
		var handler = yield driver.getHandler(persistence.connection, models);

		cachePersistences[name] = Persistence(handler, models);

		if (persistence.default) defaultPersistence = cachePersistences[name];

		if (persistence.collectionTestForFirstRun && persistence.onFirstRun) {
			var obj = handler.handlers[persistence.collectionTestForFirstRun];
			var objs = yield obj.find().exec();
			if (!objs || !objs.length) yield persistence.onFirstRun(handler.handlers);
		}
	}

	Object.freeze(this);
}

Database.prototype.getPersistence = function(persistenceName) {
	if (!persistenceName) return defaultPersistence;

	return cachePersistences[persistenceName];
}

/**
* Get all models
*/
function *getModels(modelsDir) {
	var appDir =  config.appDir,
			modelsPath = path.resolve(appDir, 'app/models', modelsDir) + '/**/*.js',
			files = yield glob(modelsPath, {}),
			models = [];

	files.forEach(function (file) {
		if (~file.indexOf('.js')) {
			models.push({
				name: S(path.basename(file, '.js')).capitalize().camelize().s,
				schema: require(path.resolve(appDir, 'app/models', modelsDir, file))
			});
		}
	});
	return models;
}

exports = module.exports = new Database;
