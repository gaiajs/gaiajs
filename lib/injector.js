/********************************
 ** Module dependencies
 ********************************/
var utils = require('./utils'),
    debug = require('debug')('gaia.injector');

var Injector = {

    dependencies: {},

    getInjectMethod: function(target) {
        if ('$inject' === utils.getFnName(target)) {
            return 'function';
        }
        if (undefined !== target.$inject) {
            return "property";
        }

        return null;
    },

    /**
     * Inject dependencies or return without do nothing
     */
    processInject: function(target) {
        if (!target) return target;
        var injectMethod = this.getInjectMethod(target);
        if (null === injectMethod) {
            return target;
        }

        debug('processInject for %s', utils.getFnName(target));

        var args = [];
        switch (injectMethod) {
            case 'function':
                var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
                var text = target.toString();
                var matches = text.match(FN_ARGS);

                args = matches[1] ? matches[1].split(',') : [];
                return target.apply(target, this.getDependencies(args));
            case 'property':
                args = [target].concat(this.getDependencies(target.$inject));
                return new(Function.prototype.bind.apply(target, args));
        }
    },

    /**
     * Inject and register
     */
    processInjectAndRegister: function(name, target) {
        if (!target) return target;
        target = this.processInject(target);
        this.register(name, target);
        return target;
    },

    /**
     * Get object in the injector
     */
    get: function(dep) {
        return this.dependencies[dep];
    },

    /**
     * Get all dependencies
     */
    getDependencies: function(arr) {
        return arr.map(function(value) {
            var toInject = value.trim();
            if (!this.dependencies[toInject]) {
                debug("Unknown dependency " + toInject);
                return null;
            }
            return this.dependencies[toInject];
        }, this);
    },

    /**
     * Register an object in injector
     */
    register: function(name, dependency) {
        debug('register %s', name);
        return this.dependencies[name] = dependency;
    },

    /**
     * Unregister object
     */
    unregister: function(name) {
        debug('unregister %s', name);
        if (this.dependencies[name]) delete this.dependencies[name];
    }
};

//tiny reference
Injector.p = Injector.processInject;

Injector.register('$injector', Injector);

module.exports = Injector;
