var portfinder = require('portfinder');
var http = require('http');
var debug = debugLog('sensor');

// var sensorServer = http.createServer(sensorServerHandler);
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
  }
}


// Handle Incoming Server Request From Sensor Socket
// Spit into Event Handler
function sensorServerHandler(req, res) {
  req.on('data', function(data) {
    try {
      var sensorData = JSON.parse(data.toString());
    } catch (e) {
      console.error('Bad JSON passed to Socket', 'from', e, data)
    }
    sensorData.eventType = 'sensor-emit';
    debug('sensor->socket->[M]'.yellow, sensorData);
    Matrix.events.emit('sensor-emit', sensorData);
    res.end('\nOK\n');
  })
}

// Open a socker server starting at 8000
// Handles Socket output to events and sockets
function sensorInitListener(data) {


  function lookupRefreshRate(name){
    return sensors.refreshTable[name] || false;
  }

  Matrix.device.sensor.init(data);

}


// send sensor data to listening processes
function sensorEventListener(data) {
  debug('[M]ev(sensor-emit)->'.green, data);

  // find app listeners
  var filteredProcesses = _.filter(Matrix.activeProcesses, function(app) {
    if ( !_.has(app, 'sensors')){
      console.error('Runaway sensor process.', data);
      return false;
    }
    return (app.type === 'app' && app.sensors.indexOf(data.sensor) > -1);
  });

  _.each(filteredProcesses, function(proc) {
    // sends to child process
    proc.send({
      eventType: 'sensor-emit',
      sensor: data.sensor,
      payload: data.payload
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
