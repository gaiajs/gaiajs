function Persistence() {
}

Persistence.prototype.connection= null;
Persistence.prototype.native= null;
Persistence.prototype.models = {};
Persistence.prototype.handlers = {};

exports = module.exports = function(handler, models) {
  return Object.create(new Persistence(), {
    connection: {value: handler.connection, writable: false},
    models: {value: models, writable:false},
    handlers: {value: handler.handlers, writable:false},
    native: {value: handler.native, writable:false}
  });
};
