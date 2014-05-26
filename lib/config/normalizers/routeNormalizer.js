exports = module.exports = function normalizeRouteConfig(config) {
  if (!config) return config;
  var methodRegex = /^(post|get|put|delete) (.*)/i;
  var controllerRegex = /([^#]*)#(.*)/;
  var newConfig = [];
  for (var p in config) {
    var routeConfig = config[p];
    delete config[p];
    if (!routeConfig) continue;

    var conf;
    if ("string" === typeof routeConfig) {
      conf = {
        method: 'get',
        controller: routeConfig
      };
    } else {
      conf = routeConfig;
    }

    var matches = p.match(methodRegex);
    if (null != matches) {
      conf.method = matches[1].toLowerCase();
      p = matches[2];
    }

    matches = conf.controller.match(controllerRegex);
    if (null != matches) {
      conf.controller = matches[1];
      conf.action = matches[2];
    }
    conf.path = p;
    newConfig.push(conf);
  }

  return newConfig;
}