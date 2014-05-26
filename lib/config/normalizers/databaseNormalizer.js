var _ = require('underscore'),
    assert = require('assert');


var defaultConfig = {
  dir: '.',
  default: false,
};

exports = module.exports = function normalizeDatabaseConfig(config) {
  if (!config) return config;
  if (!config.persistences) {
    config.name = 'default';
    config= {persistences: [ config ] };
  }
  var hasDefault = false;
  for (var k in config.persistences) {
    var persistence = _.defaults({}, defaultConfig, config.persistences[k]);
    if (persistence.default) hasDefault = true;
    validatePersitence(persistence);
    config.persistences[k] = persistence;
  }

  if (!hasDefault) {
    var defaultPersistence = config.persistences[0];
    config.persistences[0].default = true;
  }

  return config;
}


function validatePersitence(persistence) {
    assert(persistence.name);
    assert(persistence.dir);
    assert(persistence.hasOwnProperty('default'));
    assert(!persistence.hasOwnProperty('onFirstRun')
      || (persistence.hasOwnProperty('onFirstRun')
      && _.isFunction(persistence.onFirstRun)));
    assert(persistence.connection);
    assert(persistence.driver);
    assert(persistence.connection.server);
    assert(persistence.connection.database);
}
