var portfinder = require('portfinder');
var http = require('http');
var sensorServer = http.createServer(sensorServerHandler);
var io = require('socket.io')(sensorServer);

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
function sensorServerHandler(req, res) {
  req.on('data', function(data) {
    try {
      var sensorData = JSON.parse(data.toString());
    } catch (e) {
      console.error('Bad JSON passed to Socket', 'from', e, data)
    }
    sensorData.eventType = 'sensor-emit';
    log('sensor->socket->[M]'.yellow, sensorData);
    Matrix.events.emit('sensor-emit', sensorData);
    res.end('\nOK\n');
  })
}

// Open a socker server starting at 8000
function sensorInitListener(data) {
  // log('[M]->ev:sensor-init'.green, data);

  var server;
  var sensorSocket = { name: data.name };

  if(!Matrix.sensors.hasOwnProperty(data.name)){
    error(data.name, 'not on Matrix.sensors')
  }

  // filters out multiple inits
  if (_.filter(activeSensorSockets, function(s) {
      return (s.name == data.name);
    }).length > 0) {
    warn('Attempted to initialize', data.name, 'sensor multiple times');
    //TODO: Stop app layer from adding filters / event listeners (?)
  } else {
    activeSensorSockets.push(sensorSocket);
    portfinder.getPort(function(err, port) {
      if (err) return console.error(err);
      log('Sensor Socket Server Start:'.green, data.name, ': localhost:'.yellow + port)
      io.on('connection', function(socket) {

        // if socket sends a sensor-emit, emit it
        socket.on('sensor-emit', function handleDataPoint(data) {
          log('sensor->socket->[M]'.yellow, data);
          Matrix.events.emit('sensor-emit', { eventType : 'sensor-emit', paylaod: data });
        });

        socket.on('error', function (err) { error(err) });

        // make this info easily visible in the exposed array
        _.extend(sensorSocket, {
          port: port,
          socket: socket,
          server: server
        });
      });

      server = sensorServer.listen(port);
    });
  }
}


// send sensor data to listening processes
function sensorEventListener(data) {
  console.log('[M]->ev:sensor-emit'.green, data);

  // find app listeners
  var filteredProcesses = _.filter(Matrix.activeProcesses, function(app) {
    //FIXME, this is janky, maybe an app should have a sensor list
    return ( app.sensors.indexOf(data.type) > -1 );
  });

  _.each(filteredProcesses, function(proc) {
    proc.send(data);
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
