var portfinder = require('portfinder');
var http = require('http');
var debug = debugLog('sensor');

// var sensorServer = http.createServer(sensorServerHandler);
// var io = require('socket.io')(sensorServer);
// var ioClient = require('socket.io-client');
// var sensors = require('adsensors');
try {
var sensors = require('matrix-sensors');
} catch(e) {
  debug(e);
}

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

function lookupRefreshRate(name){
  return sensors.refreshTable[name] || false;
}

// Open a socker server starting at 8000
// Handles Socket output to events and sockets
function sensorInitListener(data) {
  debug('[M]->ev:sensor-init'.green, data);

  var server;
  var sensorSocket = {
    name: data.name
  };
  var handlerSocket = {
    name: data.name
  };

  var refreshRate = ( _.has(data, 'options') ) ? data.options.refresh : lookupRefreshRate(data.name) || config.refreshRate;

  // filters out multiple inits
  if (_.filter(activeSensorSockets, function(s) {
      return (s.name == data.name);
    }).length > 0) {
    warn('Attempted to initialize', data.name, 'sensor multiple times');
    //TODO: Stop app layer from adding filters / event listeners (?)
  } else {
    activeSensorSockets.push(sensorSocket);

    // NOTE: Not doing sockets anymore
    portfinder.getPort({ host: '0.0.0.0' }, function(err, port) {
      if (err) return console.error(err);

      // Setup Sensor Socket Emitter
      // server = sensorServer.listen(port);
      // sensorSocket.socket = ioClient('http://localhost:' + port);
      // log('Sensor Socket Server Start:'.green, data.name, ': localhost:'.yellow + port)
      // XXX Removed Socket Server - Not necessary

      if (!sensors.hasOwnProperty(data.name)) {
        error('No ', data.name, 'Sensor Available');
      } else {
        // setup reading the sensor
        // initial sensor kick-off timeout, to let socket first authenticate
        // setTimeout(function(){
          sensorSocket.intervalFn = setInterval(function() {
            // Look up adsensor by exposed function name
            sensors[data.name](function(err, d) {
              // Send to Event Emitter - sensorEventListener below
              Matrix.events.emit('sensor-emit', { sensor: data.name, eventType: 'sensor-emit', payload: d});
              // Send to socket connection - handleDataPoint below
              // sensorSocket.socket.emit('sensor-emit', {
              //   sensor: data.name,
              //   eventType: 'sensor-emit',
              //   payload: d
              // });
            });
          }, refreshRate);
        // }, 5000);
      }
      //
      // io.on('connection', function(socket) {
      //   log('Sensor Socket Connection:'.green, data.name, ': localhost:'.yellow + port)
      //
      //   // if socket sends a sensor-emit, relay it into the event system
      //   socket.on('sensor-emit', function handleDataPoint(d) {
      //     console.log('sensor->socket(sensor-emit)->[incoming]'.green, d);
      //     log('sensor->socket(sensor-emit)->[M]'.yellow, d);
      //     Matrix.events.emit('sensor-emit', d);
      //   });
      //
      //   socket.on('error', function(err) {
      //     error(err);
      //   });
      //
      //   // make this info easily visible in the exposed array
      //   _.extend(handlerSocket, {
      //     port: port,
      //     socket: socket,
      //     server: server
      //   });
      // });

    });
  }
}


// send sensor data to listening processes
function sensorEventListener(data) {
  debug('[M]ev(sensor-emit)->'.green, data);

  // find app listeners
  var filteredProcesses = _.filter(Matrix.activeProcesses, function(app) {
    //FIXME, this is janky, maybe an app should have a sensor list
    return (app.sensors.indexOf(data.sensor) > -1);
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
