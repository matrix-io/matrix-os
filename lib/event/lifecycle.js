
module.exports = {
  init : function(){
    Matrix.events.on('service:start', function(){
      log('Service Started')
    });

    Matrix.events.on('service:stop', function(){
      log('Service Stopped')
    });
  }
}
