/********************************
 ** Module dependencies
 ********************************/
var koa = require('koa'),
    _ = require('underscore'),
    co = require('co'),
    utils = require('./utils'),
    path = require('path'),
    logger = require('./log'),
    locals = require('koa-locals'),
    commons = require('koa-common'),
    configPath = require('./config/configPath'),
    bodyParser = require('koa-bodyparser'),
    injector = require('./injector'),
    debug = require('debug')('gaia.bootstrap'),
    send = require('koa-send');


//register default logger
injector.register('$log', logger.defaultLogger());



exports = module.exports = Gaia;

function Gaia(options) {
    if (!(this instanceof Gaia)) return new Gaia(options);

    options = options || {};
    this._hooks = options.hooks || {};

    this._configPath = new configPath();
    this._configPath.initialize(options);
    injector.register("$configPath", this._configPath);

    this._app = null;
    this.__defineGetter__("app", function() {
        return this._app
    }.bind(this));

    return this;
}

/**
 * Initialize configuration and register
 */
Gaia.prototype.initConfig = function * () {
    debug('Initialize configuration');
    var config = injector.processInject(require('./config'));
    yield config.initialize();
    injector.register('$config', config);
    this.config = config;
};

/**
 * initialiaze logger
 */
Gaia.prototype.initLog = function() {
    debug('Initialize logger');
    var log = injector.processInject(logger);
    injector.register('$log', log);
};

/**
 * Initialize middlewares
 */
Gaia.prototype.initMiddleware = function * () {
    debug('Initialize middlewares');
    var self = this,
        config = this.config, //reference to config
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
            viewDir = this._configPath.viewsDir;
        options = config.application.views.options || {};

        app.use(views(viewDir, options));
    }

    app.use(commons.favicon());
    app.use(commons.logger());
    app.use(commons.responseTime());
    app.use(commons.compress());

    app.use(function * (next) {
        if (this.path.indexOf('/public') != 0) return yield next;
        this.path = this.path.substring(7);
        yield send(this, this.path, {
            root: self._configPath.publicDir
        });
    });
};

/**
 * Initialize database
 */
Gaia.prototype.initDatabase = function * () {
    debug('Initialize database');
    var database = injector.processInject(require("gaiajs-database"));
    this.database = database;
    yield database.init();
    injector.register('$database', database);
};

/**
 * Initialize router
 */
Gaia.prototype.initRouter = function * () {
    debug('Initialize router');
    var router = yield injector.processInject(require('./router'))();
};

/**
 * Call hook if exist
 */
Gaia.prototype.hookCaller = function * (name) {
    var hook = injector.processInject(this._hooks[name]);
    if (hook) {
        debug('call hook %s', name);
        yield hook.call(hook);
    }
};

/**
 * Initialize gaia app
 */
Gaia.prototype.init = function * () {
    var self = this;
    yield self.hookCaller("beforeInit");
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
    yield self.hookCaller("afterInit");
};

/**
 * listen
 */
Gaia.prototype.listen = function * () {
    yield this.hookCaller("beforeListen");
    var config = this.config;
    var server = require('http').Server(this._app.callback());
    if (config.socket) {
        var io = require('socket.io')(server);
        injector.register("$io", io);
        injector.processInject(config.socket)();
    }
    server.listen(config.application.port);
    var log = injector.get('$log');
    log.info('Listening on port:', config.application.port);
    yield this.hookCaller("afterListen");
};

/**
 * initialize application and listen
 */
/**
 * initialize application and listen
 */
Gaia.prototype.start = function(done) {
    var self = this;
    co(function * () {
        yield self.init();
        yield self.listen();
    })(function(err) {
        if (done && _.isFunction(done)) {
            done(err, self);
        }
    });
};
