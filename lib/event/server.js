// Events that are sent from the streaming server.
// TODO: Find a better name for this, it handles all CLI events
var debug = debugLog('app');

module.exports = {
  init: function() {
    // service/stream emits these
    Matrix.events.on('cli-message', cliMessageHandler);
    Matrix.events.on('trigger', triggerHandler);
    Matrix.events.on('trigger-group', triggerOut);
    Matrix.events.on('auth-ok', Matrix.service.stream.register);
    Matrix.events.on('auth-fail', Matrix.service.stream.authError);
    Matrix.events.on('register-ok', Matrix.service.stream.registrationSuccessful);
    // not used yet
    // Matrix.events.on('user-authentication', userAuthHandler );
  }
}

function triggerOut(msg) {
  Matrix.service.stream.send('trigger-group', msg);
}

function triggerHandler(msg) {
  debug('==== SERVER-MESSAGE (TRIGGER) ==== '.red, msg)
  if (_.isString(msg)) {
    try {
      msg = JSON.parse(msg);
    } catch (err) {
      error('Server Message : JSON Error', err);
      return;
    }
  }

  var eventName = msg.type;
  var payload = msg.payload;

  Matrix.event.app.triggerHandler(payload);

}

// handle commands from server / CLI
function cliMessageHandler(msg) {
  if (_.isString(msg)) {
    try {
      msg = JSON.parse(msg);
    } catch (err) {
      error('Server Message : JSON Error', err);
      return;
    }
  }

  var eventName;
  if (_.has(msg.payload, 'type')) {
    eventName = msg.payload.type;
  } else if (_.has(msg, 'type')) {
    eventName = msg.type;
  }

  if (_.has(msg, 'payload.payload')) {
    msg = msg.payload;
  }

  var payload = msg.payload;

  debug('=(CLI)>>>>'.red, eventName, payload);
  switch (eventName) {
    case 'device-reboot':
      Matrix.device.system.reboot('CLI', debug);
      break;
    case 'app-install':
    case 'app-update':
      Matrix.service.manager.install(payload.url, payload.name, payload.version, function(err) {
        console.error(err);
      });
      break;

    case 'sensor-install':
      // just a string
      Matrix.device.sensor.install(payload);
      break;
    case 'app-uninstall':
      Matrix.service.manager.uninstall(payload.name);
      break;
    case 'app-start':
      Matrix.service.manager.start(payload.name);
      break;
    case 'app-restart':
      Matrix.service.manager.restart(payload.name);
      break;
    case 'app-stop':
      Matrix.service.manager.stop(payload.name);
      break;
      // sent via cli or dashboard
    case 'app-config-key-value':
      Matrix.service.application.updateConfigKey(payload, function(err) {
        debug(err);
      });
      break;
    case 'device-reregister':
      Matrix.service.stream.register();
      break;
    case 'app-log':
      var log = Matrix.service.manager.getLogs();
      // var follow = payload.follow;
      // send log back to streaming server
      debug('app-log Out'.yellow, log)
      Matrix.service.stream.streamLog(log);
      break;
    case 'shutdown':
      break;
    case 'trigger': //This should probably be redirected to triggerHandler
      //TODO: Standardize this
      if (_.has(payload, 'data')) {
        // from CLI 
        if (payload.data === 'amazing-matrix-ping') {
          return Matrix.device.drivers.led.ping();
        }
        Matrix.event.app.triggerHandler({ type: 'trigger', eventName: payload.data });
      } else if (_.has(payload, 'value')) {
        // sent from input

        Matrix.event.app.triggerHandler({ type: 'trigger', eventName: payload.eventName, value: payload.value });
      }
<<<<<<< HEAD
      if ( !_.has(payload,'eventName')){
        payload.eventName = payload.data;
      }
      Matrix.event.app.triggerHandler(_.extend({type: 'trigger'}, payload));
=======

>>>>>>> dev
      break;
    default:

  }


}