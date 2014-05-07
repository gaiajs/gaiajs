// Module dependencies
var koa = require('koa'),
	co = require('co'),
	path = require('path'),
	commons = require('koa-common'),
	thunkify = require('thunkify'),
	glob = thunkify(require("glob")),
	bodyParser = require('koa-bodyparser'),
	config = require('./config');

exports = module.exports = Gaia;

function Gaia(appDir) {
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
			options = config.application.views.options;

		this._app.use(views(viewDir, options));	
	}

	this._app.use(commons.favicon());
	this._app.use(commons.logger());
	this._app.use(commons.responseTime());
	this._app.use(commons.compress());


	//public
	var publicDir = "public",
		publicPath = "/public";

	if (config.application.public) {
		if (config.application.public.publicDir) publicDir = config.application.public.publicDir;
		if (config.application.public.publicPath) publicPath = config.application.public.publicPath
	}

	this._app.use(function *(next){
		if (this.path.indexOf('/public') == 0) return yield next;
		yield send(this, this.path, { root: path.resolve(this._appDir, 'public')});
	})
};

Gaia.prototype.initDatabase = function *() {
	var database = require('./database');
	yield database.init(this);
	this._app.use(database.injectDatabase());
	this.database = database;
	GLOBAL.Database = database;
}

Gaia.prototype.initRouter = function *() {
	var router = yield require('./router')(this);
}


Gaia.prototype.start = function() {
	var self = this;
	co(function *() {
		self.initLog();
		self.log.info("Init database");

		yield self.initDatabase();
		self.log.info("Init initMiddlewares");
		yield self.initMiddleware();

		self.log.info("Init router");
		yield self.initRouter();

		self._app.listen(config.application.port);
    	self.log.info('connected to database and listening on port:', config.application.port);
	})();
}