var Router = require('koa-router'),
		utils = require('./utils');

module.exports = function $injected($config, $injector, $log, $server) {
	var loader = $injector.processInject(require('./loader'));

	return function *() {
		var router = new Router(),
				controllers = yield loader.getModules('controllers'),
				hasFilters = undefined != $config.filters,
				filtersModule;

		if (hasFilters) filtersModule = yield loader.getModules('filters');

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


			if (hasFilters && $config.filters.hasOwnProperty(controllerName)) {
				var filtersName = $config.filters[controllerName][actionName],
						filtersAll = $config.filters[controllerName]['*'] || true,
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
							filtersName.push(utils.getFnName(filterInstance));
						}
					});
					args.push(action);

					$log.info(
						'{method="%s", path="%s", filters="%s"} bind on controller %s#%s',
						routeConfig.method,
						routeConfig.path,
						filtersName.join(', '),
						routeConfig.controller,
						routeConfig.action
					);

					router[routeConfig.method].apply(router, args);
				} else {
					$log.info(
						'{method="%s", path="%s", filters=""} bind on controller %s#%s',
						routeConfig.method,
						routeConfig.path,
						routeConfig.controller,
						routeConfig.action
					);
					router[routeConfig.method](routeConfig.path, action);
				}

			} else {
				$log.info(
					'{method="%s", path="%s", filters=""} bind on controller %s#%s',
					routeConfig.method,
					routeConfig.path,
					routeConfig.controller,
					routeConfig.action
				);
				router[routeConfig.method](routeConfig.path, action);
			}

		}

		$server.use(router.middleware());
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
