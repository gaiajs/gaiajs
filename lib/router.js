var Router = require('koa-router'),
		utils = require('./utils');

module.exports = function $injected($config, $injector, $log, $server) {
	var loader = $injector.processInject(require('./loader'));

	function logRoute(routeConfig, filters) {
		filters = filters? filters.join(', '): "";
		$log.info(
			'{method="%s", path="%s", filters="%s"} bind on controller %s#%s',
			routeConfig.method,
			routeConfig.path,
			filters,
			routeConfig.controller,
			routeConfig.action
		);
	}

	return function *() {
		// if ($config.generator) {
		// 	var generic = yield generateGenericRoute();
		// 	if (generic) $server.use(generic.middleware());
		// }

		var routes = yield generateRoute();
		$server.use(routes.middleware());
	};



	function *generateRoute() {

		var router = new Router(),
				controllers = yield loader.getModules('controllers'),
				hasFilters = undefined != $config.filters,
				filtersModule;

		if (hasFilters) filtersModule = yield loader.getModules('filters');

		//build function with list of filtersModule
		var _getFilter = getFilter(filtersModule);

		if (!controllers) return;
		for (var p in $config.route) {
			var routeConfig = $config.route[p],
					controllerName = routeConfig.controller,
					controller = controllers[routeConfig.controller];

			if (!controller) continue;

			var actionName = routeConfig.action,
					action = controller[actionName];

			if (!action) continue;

			//if controller has filter
			if (hasFilters && $config.filters.hasOwnProperty(controllerName)) {
				var filtersName = $config.filters[controllerName][actionName],
						filtersAll = $config.filters[controllerName]['*'] || true,
						filters = filtersName || filtersAll;

				if (false === filters) continue;

				if (filters && true !== filters) {
					if ("string" === typeof filters) filters = [ filters ];
					var args = [ routeConfig.path ],
							filtersName = [];

					//for each filter get the filter instance
					filters.forEach(function(filter) {
						var filterInstance = _getFilter(filter);
						if (filterInstance) {
							args.push(filterInstance);
							filtersName.push(utils.getFnName(filterInstance));
						}
					});
					args.push(action);

					logRoute(routeConfig, filtersName);

					router[routeConfig.method].apply(router, args);
				} else {
					logRoute(routeConfig);
					router[routeConfig.method](routeConfig.path, action);
				}

			} else {
				logRoute(routeConfig);
				router[routeConfig.method](routeConfig.path, action);
			}

		}

		return router;
	}
}

/**
 * Get filter
 */
function getFilter(filtersModule) {
	var regexParam = /([^\(]*)\(([^\/]*)\)/;
	return function(filterName) {
		var matches =  filterName.match(regexParam),
				args = [];

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
