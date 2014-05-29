var utils = require('./utils'),
debug = require('debug')('gaia.injector');

var Injector = module.exports = {

  dependencies: {},

  processInject: function(target) {
    if (!target) return target;
    if ('$injected' == utils.getFnName(target) || target.$injected) {
      debug('processInject for %s', utils.getFnName(target));
      var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
      var text = target.toString();
      var matches = text.match(FN_ARGS);

      var args = matches[1]? matches[1].split(',') : [];

      return target.apply(target, this.getDependencies(args));
    } else {
      return target;
    }
  },

  get: function(dep) {
    return this.dependencies[dep];
  },

  getDependencies: function(arr) {
    return arr.map(function(value) {
      var toInject = value.trim();
      if(!this.dependencies[toInject]) {
        throw new Error("Unknow dependency " + toInject);
      }
      return this.dependencies[toInject];
    }, this);
  },

  register: function(name, dependency) {
    debug('register %s', name);
    this.dependencies[name] = dependency;
  },

  unregister: function(name) {
    debug('unregister %s', name);
    if (this.dependencies[name]) delete this.dependencies[name];
  }
};


Injector.register('$injector', Injector);
