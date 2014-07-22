/********************************
 ** Module dependencies
 ********************************/
var path = require('path'),
    thunkify = require('thunkify'),
    glob = thunkify(require("glob")),
    S = require('string');



exports = module.exports = {

    /**
     * Get function name
     * https://gist.github.com/dfkaye/6384439
     */
    getFnName: function getFnName(fn) {
        var f = typeof fn == 'function',
            s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));

        return (!f && 'not a function') || (s && s[1] || 'anonymous');
    },

    isGenerator: function isGenerator(obj) {
        return obj && 'function' == typeof obj.next && 'function' == typeof obj.throw;
    },

    camelizePath: function(p) {
        return S(p.replace('/', '_')).camelize().s;
    }
}
