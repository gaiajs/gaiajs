var config = require('./config'),
	utils = require('./utils')(config),
	Router = require('koa-router');

module.exports = function *(gaia) {
	var router = new Router(),
			controllers = yield utils.getModules('controllers'),
			hasFilters = undefined != config.filters,
			filtersModule;

	if (hasFilters) filtersModule = yield utils.getModules('filters');

	var _getFilter = getFilter(gaia, filtersModule);

	if (!controllers) return;
	for (var p in config.route) {
		var routeConfig = config.route[p],
				controllerName = routeConfig.controller,
				controller = controllers[routeConfig.controller];

		if (!controller) continue;

		var actionName = routeConfig.action,
				action = controller[actionName];

		if (!action) continue;


		if (hasFilters && config.filters.hasOwnProperty(controllerName)) {
			var filtersName = config.filters[controllerName][actionName],
					filtersAll = config.filters[controllerName]['*'] || true,
					filters = filtersName || filtersAll;

			if (false === filters) continue;

			if (filters && true !== filters) {
				if ("string" === typeof filters) filters = [ filters ];
				var args = [ routeConfig.path ],
						filtersName = [];

				filters.forEach(function(filter) {
					var filterInstance = _getFilter(filter);
					if (filterInstance) {
						args.push(filterInstance);
						filtersName.push(getFnName(filterInstance));
					}
				});
				args.push(action);

				gaia.log.info(
					'{method="%s", path="%s", filters="%s"} bind on controller %s#%s',
					routeConfig.method,
					routeConfig.path,
					filtersName.join(', '),
					routeConfig.controller,
					routeConfig.action
				);

				router[routeConfig.method].apply(router, args);
			} else {
				gaia.log.info(
					'{method="%s", path="%s", filters=""} bind on controller %s#%s',
					routeConfig.method,
					routeConfig.path,
					routeConfig.controller,
					routeConfig.action
				);
				router[routeConfig.method](routeConfig.path, action);
			}

		} else {
			gaia.log.info(
				'{method="%s", path="%s", filters=""} bind on controller %s#%s',
				routeConfig.method,
				routeConfig.path,
				routeConfig.controller,
				routeConfig.action
			);
			router[routeConfig.method](routeConfig.path, action);
		}

	}
	gaia._app.use(router.middleware());
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

/**
 * Get filter
 */
function getFilter(gaia, filtersModule) {
	var regexParam = /([^\(]*)\(([^\/]*)\)/;
	return function(filterName) {
		var matches =  filterName.match(regexParam),
				args = [gaia.database, gaia.passport];

		if (matches) {
			filterName = matches[1];
			args.push.apply(args, matches[2].split(',').map(function(item) { return item.trim()}));
		}

		if (!filtersModule[filterName]) {
			throw new Error("Filter " + filterName + " doesn't exist !!!");
		} else {
			return filtersModule[filterName].apply(null, args);
		}

	}
}
