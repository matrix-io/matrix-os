

module.exports = {
  init: function(){
    Matrix.events.on('app-message', Matrix.service.manager.messageHandler);
    // app-data is message with type: 'data-point'
    Matrix.events.on('app-data', Matrix.service.manager.dataHandler);
  }
};
