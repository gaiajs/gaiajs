// Module dependencies
var koa = require('koa'),
	co = require('co'),
	_ = require('underscore'),
	path = require('path'),
	commons = require('koa-common'),
	thunkify = require('thunkify'),
	glob = thunkify(require("glob")),
	bodyParser = require('koa-bodyparser'),
	config = require('./config'),
	send = require('koa-send');

exports = module.exports = Gaia;

function Gaia(appDir, appConfig) {
	this._appConfig = appConfig || {};

	if (!(this instanceof Gaia)) return new Gaia(appDir);
	if (!appDir) {
		throw new Error("appDir can't be blank");
	}
	this._appDir = appDir;
	config._initialize(appDir);
	this.config = config;
	this._app = koa();
}

Gaia.prototype.initLog = function() {
	var log = require('./log');
	this.log = log.gaia;
	GLOBAL.Log = log.app;
}

Gaia.prototype.initMiddleware = function *() {
	var self = this;
	if (config.application.session) {
		var session = require('koa-sess');
		this._app.keys = config.application.session.keys || ['default-session-keys'];
		this._app.use(session());
	}

	this._app.use(bodyParser());
	if (config.authentification) {
		var auth = config.authentification;

		var passport = require('koa-passport');
		yield auth.init(passport, this.database);

		this._app.use(passport.initialize());
		this._app.use(passport.session());
		GLOBAL.Passport = this.passport = passport;
	}

	if (config.application.views) {
		var views = require('koa-render'),
			viewDir = config.application.views.dir || path.resolve(this._appDir, 'views');
			options = config.application.views.options || {};

		if (this._appConfig.registerHelpers && _.isFunction(this._appConfig.registerHelpers)) {
			options.helpers = this._appConfig.registerHelpers.call(null);
		}

		this._app.use(views(viewDir, options));
	}

	this._app.use(commons.favicon());
	this._app.use(commons.logger());
	this._app.use(commons.responseTime());
	this._app.use(commons.compress());

	this._app.use(function *(next){
		if (this.path.indexOf('/public') != 0) return yield next;
		this.path = this.path.substring(7);
		yield send(this, this.path, { root: path.resolve(self._appDir, 'public')});
	})
};

Gaia.prototype.initDatabase = function *() {
	var database = require('./database');
	this.database = database;
	GLOBAL.Database = database;
	yield database.init(this);
	this._app.use(database.injectDatabase());
}

Gaia.prototype.initRouter = function *() {
	var router = yield require('./router')(this);
}


Gaia.prototype.start = function() {
	var self = this;
	co(function *() {
		self.initLog();
		self.log.info("Init database");

		if (self.config.database) {
			yield self.initDatabase();
			self.log.info("Init initMiddlewares");
			yield self.initMiddleware();
		}
		
		if (self._appConfig.beforeRoute && _.isFunction(self._appConfig.beforeRoute)) {
			self.log.info("Call beforeRoute");
			yield self._appConfig.beforeRoute.call(null, self._app);
		}

		self.log.info("Init router");
		yield self.initRouter();

		if (self._appConfig.afterRoute && _.isFunction(self._appConfig.afterRoute)) {
			self.log.info("Call afterRoute");
			yield self._appConfig.afterRoute.call(null, self._app);
		}

		self._app.listen(config.application.port);
    	self.log.info('connected to database and listening on port:', config.application.port);
	})();
}


exports.create = function(appDir, appConfig) {
	return new Gaia(appDir, appConfig);
}