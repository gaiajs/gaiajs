var utils = require('./utils');

var Injector = module.exports = {

    dependencies: {},

    processInject: function(target) {
      if ('$injected' == utils.getFnName(target) || target.$injected) {
        var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
        var text = target.toString();
        var args = text.match(FN_ARGS)[1].split(',');
        return target.apply(target, this.getDependencies(args));
      } else {
        return target;
      }

    },

    get: function(dep) {
        return this.dependencies[dep];
    },

    getDependencies: function(arr) {
        var self = this;
        return arr.map(function(value) {
            return self.dependencies[value.trim()];
        });
    },

    register: function(name, dependency) {
        this.dependencies[name] = dependency;
    },

    unregister: function(name) {
      if (this.dependencies[name]) delete this.dependencies[name];
    }
};


Injector.register('$injector', Injector);
