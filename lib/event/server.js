module.exports = {
  init: function(){
    Matrix.events.on('server-message', serverMessageHandler );
    // not used yet
    // Matrix.events.on('user-authentication', userAuthHandler );
  }
}

// handle commands from server / CLI
function serverMessageHandler(msg){
  console.log('==== CLI MESSAGE === '.red, msg)
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
      // Matrix.service.manager.install(appUrl, name, version, cb)
      break;
    case 'app-uninstall':
      // Matrix.service.manager.uninstall(name, cb)
      break;
    case 'app-update':
     // use install
      // Matrix.service.manager.install(appUrl, name, version, cb)
      break;
    case 'app-start':
      // Matrix.service.manager.start(name, cb)
      break;
    case 'app-restart':
     // no function yet
      // Matrix.service.manager.start(appUrl, name, version, cb)
      break;
    case 'app-stop':
      // Matrix.service.manager.stop( name, cb)
      break;
    case 'reboot':

      break;
    case 'update':

      break;
    case 'log':

      break;
    case 'shutdown':

      break;
    default:

  }


}
