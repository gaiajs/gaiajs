var _ = require('underscore');


var defaultConfig = {
  name: 'default',
  dir: '.',
  default: false,
};

exports = module.exports = function normalizeDatabaseConfig(config) {
  console.log(config);
  if (!config) return config;
  if (!config.persistences) config= {persistences: [ config ] };
  var hasDefault = false;
  for (var k in config.persistences) {
    var persistence = _.defaults({}, defaultConfig, config.persistences[k]);
    if (persistence.default) hasDefault = true;
    config.persistences[k] = persistence;
  }

  if (!hasDefault) {
    var defaultPersistence = config.persistences[0];
    config.persistences[0].default = true;
  }

  return config;
}