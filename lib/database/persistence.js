function Persistence() {
}

Persistence.prototype.connection= null;
Persistence.prototype.native= null;
Persistence.prototype.models = {};
Persistence.prototype.repositories = {};
Persistence.prototype.default = false

exports = module.exports = function(schema, models, isDefault) {
  var repositories = {};
  models.forEach(function(model) {
    repositories[model.name] = model.schema;
  });
  return Object.create(new Persistence(), {
    schema: {value: schema, writable: false},
    models: {value: models, writable:false},
    repositories: {value: repositories, writable:false},
    default: {value: isDefault, writable:false}
  });
};
