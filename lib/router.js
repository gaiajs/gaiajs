var config = require('./config'),
	utils = require('./utils')(config),
	Router = require('koa-router');

module.exports = function *(gaia) {
	var router = new Router();
	var controllers = yield utils.getModules('controllers');
	var hasFilters = undefined != config.filters;
	var filtersModule;

	if (hasFilters) var filtersModule = yield utils.getModules('filters');

	var _getFilter = getFilter(gaia, filtersModule);

	if (!controllers) return;
	for (var p in config.route) {
		var routeConfig = config.route[p];

		var controllerName = routeConfig.controller;
		var controller = controllers[routeConfig.controller];

		if (!controller) continue;

		var actionName = routeConfig.action;
		var action = controller[actionName];
		if (!action) continue;


		if (hasFilters && config.filters.hasOwnProperty(controllerName)) {
			var filtersName = config.filters[controllerName][actionName];
			var filtersAll = config.filters[controllerName]['*'] || true;

			var filters = filtersName || filtersAll;
			if (false === filters) continue;

			if (filters && true !== filters) {
				if ("string" === typeof filters) filters = [ filters ];
				var args= [ routeConfig.path ];
				filters.forEach(function(filter) {
					var filterInstance = _getFilter(filter);
					if (filterInstance) args.push(filterInstance);
				});
				args.push(action);

				gaia.log.info(
					'%s [%s] bind on controller %s action %s with filters',
					routeConfig.method,
					routeConfig.path,
					routeConfig.controller,
					routeConfig.action
				);

				router[routeConfig.method].apply(router, args);
			} else {
				gaia.log.info(
					'%s [%s] bind on controller %s action %s',
					routeConfig.method, routeConfig.path,
					routeConfig.controller,
					routeConfig.action
				);
				router[routeConfig.method](routeConfig.path, action);
			}

		} else {
			gaia.log.info(
				'%s [%s] bind on controller %s action %s',
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
 * Get filter
 */
function getFilter(gaia, filtersModule) {
	var regexParam = /([^\(]*)\(([^\/]*)\)/;
	return function(filterName) {
		var matches =  filterName.match(regexParam);
		var args = [gaia.database, gaia.passport];
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
