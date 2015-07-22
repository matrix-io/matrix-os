var portfinder = require('portfinder');
var http = require('http');

module.exports = {
  init: function(){
    Matrix.events.on('sensor-event', sensorEventListener );
    Matrix.events.on('sensor-init', sensorInitListener );
  }
}

function sensorInitListener(data){
  // console.log('[M]->ev:sensor-init'.green, data);

  portfinder.getPort(function(err, port){
    if (err) return console.error(err);
    log('opening server on http://localhost:'.yellow + port)
    var server = http.createServer( function (req, res) {
      req.on('data', function(data){
        try {
          var sensorData =  JSON.parse(data.toString());
        } catch(e) {
          console.error('Bad JSON passed to Socket', port, 'from', data.name, e)
        }
        sensorData.eventType = 'sensor-event';
        log('sensor->socket->[M]'.yellow, sensorData);
        Matrix.events.emit('sensor-event', sensorData );
        res.end('\nOK\n');
      })
    }).listen(port);
  });
}

function sensorEventListener( data ){
  console.log('[M]->ev:sensor-event'.green, data);

  // send to app listeners
  var filteredApps = _.filter(Matrix.activeProcesses, function (app) {
    //FIX ME, this is janky, maybe an app should have a sensor list
    return app.name === data.sensorType;
  });

  _.each(filteredApps, function( proc ){
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
