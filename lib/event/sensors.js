var portfinder = require('portfinder');
var http = require('http');

module.exports = {
  init: function(){
    Matrix.events.on('sensor-event', sensorEventListener );
    Matrix.events.on('sensor-init', sensorInitListener );
  }
}

function sensorInitListener(data){
  console.log('[M]->ev:sensor-init'.green, data);

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
        log('sensor->socket->[M]'.yellow, JSON.parse(data.toString()));
        Matrix.events.emit('sensor-event', JSON.parse(data.toString()));
      })
    }).listen(port);
  });
}

function sensorEventListener( data ){
  console.log('[M]->ev:sensor-event'.green, data);

  // pm2
  // send to app listeners
  var filteredApps = _.filter( function (data) {
    return _.some(Matrix.activeApplications, function(app){
      return app.type === data.type;
    });
  });

  console.log(filteredApps);

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
