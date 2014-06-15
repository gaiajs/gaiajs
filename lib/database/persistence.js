function Persistence() {
}

Persistence.prototype.connection= null;
Persistence.prototype.native= null;
Persistence.prototype.models = {};
Persistence.prototype.repositories = {};
Persistence.prototype.default = false

exports = module.exports = function(schema, models, isDefault) {
  return Object.create(new Persistence(), {
    schema: {value: schema, writable: false},
    models: {value: models, writable:false},
    repositories: {value: models.map(function(model){ return model.schema}), writable:false},
    default: {value: isDefault, writable:false}
  });
};
