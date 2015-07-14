module.exports = {
  init: function(){
    Matrix.events.on('app-start', Matrix.api.app.start);
    Matrix.events.on('app-stop', Matrix.api.app.stop);
    Matrix.events.on('app-install', Matrix.api.app.install);
    Matrix.events.on('app-restart', Matrix.api.app.restart);
    Matrix.events.on('app-update', Matrix.api.app.update);
    Matrix.events.on('app-uninstall', Matrix.api.app.uninstall);
    Matrix.events.on('app-list', function(){
      log('applist')
      Matrix.api.app.list(function(err, data){
        console.log("hah");
      })
    });
  }
};
