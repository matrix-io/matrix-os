

module.exports = {
  init: function(){
    // Events Sent From Server, emitted internally via EventRouter
    Matrix.events.on('app-start', Matrix.service.manager.start);
    Matrix.events.on('app-stop', Matrix.service.manager.stop);
    Matrix.events.on('app-install', Matrix.service.manager.install);
    Matrix.events.on('app-restart', Matrix.service.manager.restart);
    Matrix.events.on('app-update', Matrix.service.manager.update);
    Matrix.events.on('app-uninstall', Matrix.service.manager.uninstall);
    Matrix.events.on('app-list', function(){
      Matrix.service.manager.list(function(err, data){
        if (err) console.error(err);
        log('App List:', data);
      });
    });
    //perist app process
  }
};
