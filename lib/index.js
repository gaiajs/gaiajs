// Module dependencies
var koa = require('koa'),
	co = require('co'),
	_ = require('underscore'),
	path = require('path'),
	locals = require('koa-locals'),
	commons = require('koa-common'),
	bodyParser = require('koa-bodyparser'),
	config = require('./config'),
	injector = require('./injector'),
	send = require('koa-send');

exports = module.exports = Gaia;

function Gaia(appDir, hooks) {
	this._hooks = hooks || {};

	if (!(this instanceof Gaia)) return new Gaia(appDir);
	if (!appDir) {
		throw new Error("appDir can't be blank");
	}
	this._appDir = appDir;
}

Gaia.prototype.initConfig = function *() {
	yield config.initialize(this._appDir);
	injector.register('$config', config);
	this.config = config;
};

Gaia.prototype.initLog = function() {
	var log = injector.processInject(require('./log'));
	this.log = log.gaia;
	injector.register('$gaiaLog', log.gaia);
	injector.register('$log', log.app);
};

Gaia.prototype.initMiddleware = function *() {
	var self = this,
			app = this._app;

	if (config.application.session) {
		var session = require('koa-sess');
		app.keys = config.application.session.keys || ['default-session-keys'];
		app.use(session());
	}

	app.use(bodyParser());
	if (config.authentification) {
		var passport = require('koa-passport');
		injector.register('$passport', passport);

		var auth = injector.processInject(config.authentification);
		yield auth.init();

		app.use(passport.initialize());
		app.use(passport.session());
		this.passport = passport;
	}

	if (config.application.i18n) {
		var locale = require('koa-locale')
		locale(app);
	}

	locals(app, {
		__gaia: 'Gaia application'
	});

	if (config.application.i18n) {
		var i18n = require('koa-i18n')
		app.use(i18n(app, config.application.i18n));
	}

	if (config.application.views) {
		var views = require('koa-render-locals'),
				viewDir = config.application.views.dir || path.resolve(this._appDir, 'views');
				options = config.application.views.options || {};

		app.use(views(viewDir, options));
	}

	app.use(commons.favicon());
	app.use(commons.logger());
	app.use(commons.responseTime());
	app.use(commons.compress());

	app.use(function *(next){
		if (this.path.indexOf('/public') != 0) return yield next;
		this.path = this.path.substring(7);
		yield send(this, this.path, { root: path.resolve(self._appDir, 'public')});
	});
};

Gaia.prototype.initDatabase = function *() {
	var database = injector.processInject(require('./database'));
	this.database = database;
	GLOBAL.Database = database;
	yield database.init();
};

Gaia.prototype.initRouter = function *() {
	var router = yield injector.processInject(require('./router'))();
};


Gaia.prototype.start = function() {
	var self = this;
	var start = new Date().getTime();
	co(function *() {
		yield self.initConfig();
		self._app = koa();
		injector.register('$server', self._app);
		self.initLog();

		if (self.config.database) {
			self.log.info("Init database");
			yield self.initDatabase();
		}

		if (self._hooks.beforeMiddlewares && _.isFunction(self._hooks.beforeMiddlewares)) {
			self.log.info("Call beforeMiddlewares");
			yield self._hooks.beforeMiddlewares.call(null, self._app);
		}

		self.log.info("Init initMiddlewares");
		yield self.initMiddleware();

		if (self._hooks.beforeRoute && _.isFunction(self._hooks.beforeRoute)) {
			self.log.info("Call beforeRoute");
			yield self._hooks.beforeRoute.call(null, self._app);
		}

		self.log.info("Init router");
		yield self.initRouter();

		if (self._hooks.afterRoute && _.isFunction(self._hooks.afterRoute)) {
			self.log.info("Call afterRoute");
			yield self._hooks.afterRoute.call(null, self._app);
		}

		self._app.listen(config.application.port);
		self.log.info('connected to database and listening on port:', config.application.port);
		self.log.info('started on %d ms', new Date().getTime() - start);
	})();
};


exports.create = function(appDir, hooks) {
	return new Gaia(appDir, hooks);
};
