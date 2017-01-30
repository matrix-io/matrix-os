var portfinder = require('portfinder');
var http = require('http');
var debug = debugLog('sensor');

// var io = require('socket.io')(sensorServer);
// var ioClient = require('socket.io-client');
// var sensors = require('adsensors');

// TODO: Remove all reference to sensor sockets.
var activeSensorSockets = [];

module.exports = {
  sensors: activeSensorSockets,
  init: function() {
    Matrix.events.on('sensor-emit', sensorEventListener);
    Matrix.events.on('sensor-init', sensorInitListener);
    Matrix.events.on('sensor-close', sensorCloseListener);
    Matrix.events.on('sensor-install', Matrix.device.sensor.install);
  }
}

// Open a socker server starting at 8000
// Handles Socket output to events and sockets
function sensorInitListener(sensorInitObj) {

  Matrix.device.sensor.start(sensorInitObj);

}


// send sensor data to listening processes
function sensorEventListener(msg) {
  debug('[M]ev(sensor-emit)->'.green, msg);

  // find app listeners
  var targetApplications = _.filter(Matrix.activeApplications, function(app) {
    debug( app.sensors, '=?'.blue, msg.type );

    if ( _.has( app, 'sensors' ) && !_.isUndefined(app.sensors) ){
      return ( app.sensors.indexOf(msg.type) > -1 );
    }
  })

  if ( targetApplications.length === 0 ){
    debug('Sensor Event with No Application Listener', msg, Matrix.activeApplications);
  }

  var payload = _.omit(msg, 'type');

  _.each(targetApplications, function(proc) {
    // sends to child process
    proc.process.send({
      eventType: 'sensor-emit',
      sensor: msg.type,
      payload: payload
    });
  });
}

// Untested
function sensorCloseListener(sensorName) {
  var sensor = _.filter(activeSensorSockets, function(s) {
    return (s.name === sensorName);
  });
  if (_.isEmpty(sensor)) {
    warn('Sensor:', sensorName, 'not open')
  } else if (sensor.length > 1) {
    error('Multiple Versions of Same Sensor Detected. Error Condition.')
  } else {
    sensor[0].socket.disconnect();;
  }
}
