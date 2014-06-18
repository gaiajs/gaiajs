exports.generate = function (repository, enableQuery) {
  var Controller = {};

  /******************************
   * Create
   ******************************/
  Controller.create = function *() {
    var result = yield repository.create(this.request.body);
    this.body = result;
  };

  if (enableQuery) {
    Controller.createQuery = function *() {
      var result = yield repository.create(this.request.query);
      this.body = result;
    };
  }


  /******************************
   * Read
   ******************************/
  Controller.index = function *() {
    this.body = yield repository.all();
  };

  Controller.findById = function *() {
    this.body = yield repository.find(this.params.id);
  };

  Controller.find = function *(){
    this.body = yield repository.all(this.request.query);
  };

  /******************************
   * Update
   ******************************/

  function *update(id, attributes){
    var obj = yield repository.find(id);
    var result = yield obj.updateAttributes(attributes);
    return result;
  }


  Controller.update = function *() {
    this.body = yield update(this.params.id, this.request.body);
  }

  if (enableQuery) {
    Controller.updateQuery = function *() {
      this.body = yield update(this.params.id, this.request.query);
    };
  }

  /******************************
   * Delete
   ******************************/
  Controller.delete = function *() {
    var obj = yield repository.find(this.params.id);
    var result = yield obj.destroy();
    this.body = {};
  };

  return Controller;
}
