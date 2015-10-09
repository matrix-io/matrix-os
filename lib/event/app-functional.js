

module.exports = {
  init: function(){
    Matrix.events.on('app-emit', Matrix.service.manager.dataHandler);
    Matrix.events.on('app-config', Matrix.service.stream.sendConfig);
  }
};
