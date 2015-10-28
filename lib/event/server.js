// Events that are sent from the streaming server.
var debug = debugLog('app');

module.exports = {
  init: function(){
    Matrix.events.on('cli-message', serverMessageHandler );
    // not used yet
    // Matrix.events.on('user-authentication', userAuthHandler );
  }
}

// handle commands from server / CLI
function serverMessageHandler(msg){
  debug('==== SERVER-MESSAGE (CLI) ==== '.red, msg)
  if (_.isString(msg)){
    try {
      msg = JSON.parse(msg);
    } catch (err) {
      error('Server Message : JSON Error', err);
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
      Matrix.service.manager.restart( payload.name );
      break;
    case 'app-stop':
      Matrix.service.manager.stop( payload.name );
      break;
    case 'app-config-update':
      Matrix.service.manager.updateConfig( payload, function(err){
        debug(err);
      });
      break;
    case 'log':

      break;
    case 'shutdown':

      break;
    default:

  }


}
