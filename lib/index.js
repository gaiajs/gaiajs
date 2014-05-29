// Module dependencies
var koa = require('koa'),
	co = require('co'),
	utils = require('./utils'),
	path = require('path'),
	locals = require('koa-locals'),
	commons = require('koa-common'),
	bodyParser = require('koa-bodyparser'),
	config = require('./config'),
	injector = require('./injector'),
	debug = require('debug')('gaia.bootstrap'),
	send = require('koa-send');

exports = module.exports = Gaia;

function Gaia(appDir, hooks) {
	this._hooks = hooks || {};

	if (!(this instanceof Gaia)) return new Gaia(appDir, hooks);
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
	injector.register('$log', log.app);
};

Gaia.prototype.initMiddleware = function *() {
	var self = this,
			app = this._app;

	if (config.application.session) {
		debug("Init session");
		var session = require('koa-sess');
		app.keys = config.application.session.keys || ['default-session-keys'];
		app.use(session());
	}

	app.use(bodyParser());

	if (config.authentification) {
		debug("Init auth");
		var passport = require('koa-passport');
		injector.register('$passport', passport);

		var auth = injector.processInject(config.authentification);
		yield auth.init();

		app.use(passport.initialize());
		app.use(passport.session());
		this.passport = passport;
	}

	if (config.application.i18n) {
		debug('Init i18n');
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
		debug('init views');
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
	//GLOBAL.Database = database;
	yield database.init();
};

Gaia.prototype.initRouter = function *() {
	var router = yield injector.processInject(require('./router'))();
};

Gaia.prototype.hookCaller = function *(name) {
	var hook = injector.processInject(this._hooks[name]);
	if (hook) {
		debug('call hook %s', name);
		yield hook.call(hook);
	}
};


Gaia.prototype.start = function() {
	var self = this;
	var start = new Date().getTime();
	co(function *() {
		debug("Init config");
		yield self.initConfig();

		debug("Init koa app");
		self._app = koa();
		injector.register('$server', self._app);

		debug("Init log");
		self.initLog();

		if (self.config.database) {
			debug("Init database");
			yield self.hookCaller("beforeDatabase");
			yield self.initDatabase();
			yield self.hookCaller("afterDatabase");
		}

		debug("Init initMiddlewares");
		yield self.hookCaller("beforeMiddlewares");
		yield self.initMiddleware();
		yield self.hookCaller("afterMiddlewares");

		debug("Init router");
		yield self.hookCaller("beforeRoute");
		yield self.initRouter();
		yield self.hookCaller("afterRoute");

		self._app.listen(config.application.port);
		var log = injector.get('$log');
		log.info('Listening on port:', config.application.port);
		log.info('started on %d ms', new Date().getTime() - start);
	})();
};


exports.create = function(appDir, hooks) {
	return new Gaia(appDir, hooks);
};
