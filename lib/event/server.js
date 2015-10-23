// Events that are sent from the streaming server.
module.exports = {
  init: function(){
    Matrix.events.on('cli-message', serverMessageHandler );
    // not used yet
    // Matrix.events.on('user-authentication', userAuthHandler );
  }
}

// handle commands from server / CLI
function serverMessageHandler(msg){
  console.log('==== SERVER-MESSAGE (CLI) ==== '.red, msg)
  if (_.isString(msg)){
    try {
      msg = JSON.parse(msg);
    } catch (err) {
      console.log('Server Message : JSON Error', err);
      return;
    }
  }

  var eventName = msg.type;
  var payload = msg.payload;

  switch (eventName) {
    case 'app-install':
    case 'app-update':
      Matrix.service.manager.install(payload.url, payload.name, payload.version);
      break;
    case 'app-uninstall':
      Matrix.service.manager.uninstall(payload.name)
      break;
    case 'app-start':
      Matrix.service.manager.start(payload.name)
      break;
    case 'app-restart':
      Matrix.service.manager.stop( payload.name, function(){
        Matrix.service.manager.start(payload.url, payload.name, payload.version);
      });
      break;
    case 'app-stop':
      Matrix.service.manager.stop( payload.name );
      break;
    case 'app-config-update':
      Matrix.service.manager.updateConfig( payload, function(err){
        console.log(err);
      } );
      break;
    case 'log':

      break;
    case 'shutdown':

      break;
    default:

  }


}
