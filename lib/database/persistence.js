function Persistence() {
}

Persistence.prototype.connection= null;
Persistence.prototype.native= null;
Persistence.prototype.models = {};
Persistence.prototype.repositories = {};
Persistence.prototype.default = false

exports = module.exports = function(persistenceDefinition, models, isDefault) {
  return Object.create(new Persistence(), {
  	generatorController: {value: persistenceDefinition.generatorController, writable: false},
    connection: {value: persistenceDefinition.connection, writable: false},
    models: {value: models, writable:false},
    repositories: {value: persistenceDefinition.repositories, writable:false},
    native: {value: persistenceDefinition.native, writable:false},
    default: {value: isDefault, writable:false}
  });
};
