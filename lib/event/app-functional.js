

module.exports = {
  init: function(){
    Matrix.events.on('handle-app-message', Matrix.service.manager.messageHandler);
    // app-data is message with type: 'data-point'
    Matrix.events.on('handle-app-data', Matrix.service.manager.dataHandler);
  }
};
