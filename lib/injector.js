var Injector = module.exports = {

    dependencies: {},

    processInject: function(target) {
      console.log(target, typeof target, getFnName(target), target.$injected);
      if ('$injected' == getFnName(target) || target.$injected) {
        console.log('injected', getFnName(target));
        var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
        var text = target.toString();
        var args = text.match(FN_ARGS)[1].split(',');
        return target.apply(target, this.getDependencies(args));
      } else {
        console.log('no injected');
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
    }

};

/**
 * Get function name
 * https://gist.github.com/dfkaye/6384439
 */
function getFnName(fn) {
  var f = typeof fn == 'function',
      s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));

  return (!f && 'not a function') || (s && s[1] || 'anonymous');
}

Injector.register('$injector', Injector);