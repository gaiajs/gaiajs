/********************************
 ** Module dependencies
 ********************************/
var assert = require('assert');

exports = module.exports = function normalizeRouteConfig(config) {
    if (!config) return config;

    var methodRegex = /^(post|get|put|delete) (.*)/i,
        controllerRegex = /([^#]*)#(.*)/,
        newConfig = [];

    for (var path in config) {
        var routeConfig = config[path];
        delete config[path];
        if (!routeConfig) continue;

        var route;
        if ("string" === typeof routeConfig) {
            route = {
                method: 'get',
                controller: routeConfig
            };
        } else {
            route = routeConfig;
        }

        var matches = path.match(methodRegex);
        if (null != matches) {
            route.method = matches[1].toLowerCase();
            path = matches[2];
        }

        matches = route.controller.match(controllerRegex);
        if (null != matches) {
            route.controller = matches[1];
            route.action = matches[2];
        }
        route.path = path;
        validateRoute(route);
        newConfig.push(route);
    }

    return newConfig;
};

function validateRoute(route) {
    assert(route.method, "[route config] is mandatory for " + JSON.stringify(route));
    assert(route.controller, "[route config] is mandatory for " + JSON.stringify(route));
    assert(route.action, "[route config] is mandatory for " + JSON.stringify(route));
    assert(route.path, "[route config] is mandatory for " + JSON.stringify(route));
}
