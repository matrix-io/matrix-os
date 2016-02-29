var debug = debugLog('device-sensor')
var sensors = [];
module.exports = {
  init: function(options){
    var sensor;
    var name = options.name;
    if ( _.isUndefined(options)){
      // init() is called on lib startup
    } else {
      if ( sensors.indexOf(name) !== -1 ){
        return warn('Duplicate Sensor Initialization')
      }

      sensors.push(name);
      // init() called from app
      debug('Sensor.init(', options);

      try {
        var sensorCmd = __dirname+'../../../node_modules/matrix-'+name+'-sensor/bin/sensor';
        // debug(sensorCmd);
        sensor = require('child_process').fork(sensorCmd, { env: {
          REFRESH_RATE: Matrix.config.sensorRefresh
        }, silent: true });
      } catch (e) {
        console.error('Sensor Init Fails', name, e);
      }


      sensor.stdout.on('data', function(data){
        try {
          var dp = JSON.parse(data);
        } catch(e){
          error('Sensor Format Error', e);
        }
        Matrix.events.emit('sensor-emit', data.toString());
      });

      sensor.stderr.on('data', function(data){
        Matrix.events.emit('sensor-error', data.toString());
      });
    }
  }
}
