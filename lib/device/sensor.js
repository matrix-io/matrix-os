var debug = debugLog('device-sensor')
var sensors = [];
module.exports = {
  init: function(options){
    var sensor;
    var name = options.name;
    if ( _.isUndefined(options)){
      // init() is called on startup
    } else {
      // init() called from app
      debug('Sensor.init(', options);
      try {
        var sensorCmd = __dirname+'../../../node_modules/matrix-'+name+'-sensor/bin/sensor';
        // debug(sensorCmd);
        sensor = require('child_process').fork(sensorCmd, { env: { REFRESH_RATE: 100 }, silent: true });
      } catch (e) {
        console.error('Sensor Init Fails', name, e);
      }

      sensor.stdout.on('data', function(data){
        console.log(data.toString());
      });

      sensor.stderr.on('data', function(data){
        console.log(data.toString())
      });
    }
  }
}
