function Persistence() {
}

Persistence.prototype.connection= null;
Persistence.prototype.native= null;
Persistence.prototype.models = {};
Persistence.prototype.repositories = {};

exports = module.exports = function(persistenceDefinition, models) {
  return Object.create(new Persistence(), {
    connection: {value: persistenceDefinition.connection, writable: false},
    models: {value: models, writable:false},
    repositories: {value: persistenceDefinition.repositories, writable:false},
    native: {value: persistenceDefinition.native, writable:false}
  });
};