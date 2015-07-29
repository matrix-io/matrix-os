var portfinder = require('portfinder');
var http = require('http');
var sensorServer = http.createServer(sensorServerHandler);
var io = require('socket.io')(sensorServer);

var activeSensorSockets = [];

module.exports = {
  sensors: activeSensorSockets,
  init: function() {
    Matrix.events.on('sensor-event', sensorEventListener);
    Matrix.events.on('sensor-init', sensorInitListener);
    Matrix.events.on('sensor-close', sensorCloseListener);
  }
}

function sensorServerHandler(req, res) {
  io.on('data-point', function(data) {
    log('iodp', data);
  })
  req.on('data', function(data) {
    try {
      var sensorData = JSON.parse(data.toString());
    } catch (e) {
      console.error('Bad JSON passed to Socket', 'from', e, data)
    }
    sensorData.eventType = 'sensor-event';
    log('sensor->socket->[M]'.yellow, sensorData);
    Matrix.events.emit('sensor-event', sensorData);
    res.end('\nOK\n');
  })
}

// Sensor Socket emits data point
function handleDataPoint(data) {
  log('sensor->socket->[M]'.yellow, data);
  data.eventType = 'sensor-event';
  Matrix.events.emit('sensor-event', data);
}

function handleError(err) {
  error(err);
}

// Fired From App
function sensorInitListener(data) {
  // console.log('[M]->ev:sensor-init'.green, data);

  var server;
  var sensorSocket = { name: data.name };

  // filters out multiple inits
  if (_.filter(activeSensorSockets, function(s) {
      return (s.name == data.name);
    }).length > 0) {
    warn('Attempted to initialize', data.name, 'multiple times');
  } else {
    activeSensorSockets.push(sensorSocket);
    portfinder.getPort(function(err, port) {
      if (err) return console.error(err);
      log('Sensor Socket Server Start:'.green, data.name, ': localhost:'.yellow + port)
      io.on('connection', function(socket) {
        socket.on('data-point', handleDataPoint);
        socket.on('error', handleError);
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

function sensorEventListener(data) {
  console.log('[M]->ev:sensor-event'.green, data);

  // send to app listeners
  var filteredApps = _.filter(Matrix.activeProcesses, function(app) {
    //FIX ME, this is janky, maybe an app should have a sensor list
    return app.name === data.type;
  });

  _.each(filteredApps, function(proc) {
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
