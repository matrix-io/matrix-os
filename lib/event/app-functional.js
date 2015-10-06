

module.exports = {
  init: function(){
    Matrix.events.on('app-emit', Matrix.service.manager.dataHandler);
  }
};
