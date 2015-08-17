

module.exports = {
  init: function(){
    //
    Matrix.events.on('app-message', Matrix.service.manager.messageHandler);
    // app-emit is message with type: 'sensor-emit'
    Matrix.events.on('app-emit', Matrix.service.manager.dataHandler);
  }
};
