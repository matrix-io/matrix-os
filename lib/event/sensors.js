var portfinder = require('portfinder');
var http = require('http');
var sensorServer = http.createServer(sensorServerHandler);
var io = require('socket.io')(sensorServer);

module.exports = {
  init: function() {
    Matrix.events.on('sensor-event', sensorEventListener);
    Matrix.events.on('sensor-init', sensorInitListener);
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

function handleDataPoint(data) {
  log('sensor->socket->[M]'.yellow, data);
  data.eventType = 'sensor-event';
  Matrix.events.emit('sensor-event', data);
}

function handleError(err){
  error(err);
}

function sensorInitListener(data) {
  // console.log('[M]->ev:sensor-init'.green, data);

  portfinder.getPort(function(err, port) {
    if (err) return console.error(err);
    log('Server Start:'.green, data.name, ': localhost:'.yellow + port)
    io.on('connection', function(socket) {
      socket.on('data-point', handleDataPoint);
      socket.on('error', handleError);
    });
    sensorServer.listen(port);
  });
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

  //
  // // filter data
  // var Filter = require('admobilize-eventfilter-sdk').EventFilter;
  // var applyFilter = require('admobilize-eventfilter-sdk').apply;
  //
  // var tempFilter = new Filter('temperature');
  //
  // tempFilter.has('value').between(32, 68);
  //
  //
  // var filtered = applyFilter( tempFilter, data );
  //
  // console.log('Filter'.yellow, tempFilter.json());
  // if (filtered) {
  //   console.log('good:'.green, filtered);
  // } else {
  //   log('bad'.red, data);
  // }
  // send to api
}
