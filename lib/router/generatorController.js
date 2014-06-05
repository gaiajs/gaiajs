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
    this.body = yield repository.find().exec();
  };

  Controller.findById = function *() {
    this.body = yield repository.findById(this.params.id).exec();
  };

  Controller.find = function *(){
    this.body = yield repository.find(this.request.query).exec();
  };

  /******************************
   * Update
   ******************************/
  Controller.update = function *() {
    var result = yield repository.findByIdAndUpdate(this.params.id, this.request.body).exec();
    this.body = result;
  }

  if (enableQuery) {
    Controller.updateQuery = function *() {
      var result = yield repository.findByIdAndUpdate(this.params.id, this.request.query).exec();
      this.body = result;
    };
  }

  /******************************
   * Delete
   ******************************/
  Controller.delete = function *() {
    var result = yield repository.findByIdAndRemove(this.params.id).exec();
    this.body = result;
  };

  return Controller;
}
