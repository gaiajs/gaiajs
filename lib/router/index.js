var Router = require('koa-router'),
		utils = require('../utils'),
		_ = require('underscore');

module.exports = function $inject($config, $injector, $log, $server, $database) {
	var loader = $injector.processInject(require('../loader'));

	/**
	 * helper for log route
	 */
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

	/**
	 * generate routing
	 */
	return function *() {
		var hasFilters = undefined != $config.filters,
				_getFilter = null;

		//if has filter so generate function for get the filter
		if (hasFilters) {
			var filtersModule = yield loader.getModules('filters');
			_getFilter = getFilter(filtersModule);
		}

		var controllers = yield loader.getModules('controllers');

		if ($config.generator) {
			var _ref, genericControllers, routes;

			_ref = generateGenericControllers(controllers, $config.generator.models),
			genericControllers = _ref[0],
			genericRoutes = _ref[1];

			var routes = yield generateRoute(genericControllers, genericRoutes, _getFilter);
			$server.use(routes.middleware());
		}

		var routes = yield generateRoute(controllers, $config.route, _getFilter);
		$server.use(routes.middleware());
	};

	/**
	 * Generate genereic controllers
	 */
	function generateGenericControllers(controllers, models) {
		var genericControllers = {},
				genericRoute = [];

		models.forEach(function(model) {
			var persistence = $database.getPersistenceOfModel(model);
			if (null == persistence) {
				throw new Error('');
			}
			var defaultController = {};
			var modelRest = model + "Rest";

			if (controllers.hasOwnProperty(modelRest)) {
				defaultController = controllers[modelRest];
			} else if (controllers.hasOwnProperty(utils.camelizePath(modelRest))) {
				defaultController = controllers[utils.camelizePath(modelRest)];
			}

			var generatorController = persistence.generatorController;

			genericControllers[modelRest] = _.defaults({}, defaultController, generatorController.generate(persistence.repositories[model], true));
			//create
			genericRoute.push({ method: 'post', controller: modelRest, action: 'create', path: '/' +  model});
			genericRoute.push({ method: 'get', controller: modelRest, action: 'createQuery', path: '/' +  model + '/create'});

			//Read
			genericRoute.push({ method: 'get', controller: modelRest, action: 'index', path: '/' +  model});
			genericRoute.push({ method: 'get', controller: modelRest, action: 'findById', path: '/' +  model + '/:id'});
			genericRoute.push({ method: 'get', controller: modelRest, action: 'find', path: '/' +  model + '/find'});

			//update
			genericRoute.push({ method: 'put', controller: modelRest, action: 'update', path: '/' +  model + '/:id'});
			genericRoute.push({ method: 'get', controller: modelRest, action: 'updateQuery', path: '/' +  model + '/update/:id'});

			//update
			genericRoute.push({ method: 'delete', controller: modelRest, action: 'delete', path: '/' +  model + '/:id'});
			genericRoute.push({ method: 'get', controller: modelRest, action: 'delete', path: '/' +  model + '/delete/:id'});

		});

		return [genericControllers, genericRoute]
	}

	/**
	 * Generate routes
	 */
	function *generateRoute(controllers, routing, _getFilter) {

		var router = new Router();

		if (!controllers) return;
		for (var p in routing) {
			var routeConfig = routing[p],
					controllerName = routeConfig.controller,
					controller = controllers[routeConfig.controller];

			if (!controller) continue;

			var actionName = routeConfig.action,
					action = controller[actionName];

			if (!action) continue;

			//if controller has filter
			if (_getFilter && $config.filters.hasOwnProperty(controllerName)) {
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
