

var debug = debugLog('device-sensor')


function stopSensor( sensor ){
  if ( _.isString(sensor)){
    warn('stopSensor is not implemented yet fro string')
  } else if (_.isObject(sensor)){
    // processes
    Matrix.device.process.kill(sensor.id);
  }
}

module.exports = {
  init: function(options){
    var sensor;
    var name = options.name;
    if ( _.isUndefined(options)){
      // init() is called on lib startup
    } else {
      if ( Matrix.activeSensors.indexOf(name) !== -1 ){
        return warn('Duplicate Sensor Initialization')
      }

      Matrix.activeSensors.push(name);
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

      _.extend(sensor, {
        name: name
      })

      Matrix.activeSensors.push(sensor);

      // for persistance
      Matrix.db.service.insert({
        activeSensor: {
          name: name,
          pid: sensor.pid
        }
      });

      sensor.stdout.on('data', function(data){
        try {
          var data = JSON.parse(data);
        } catch(e){
          error('Sensor Format Error', e);
        }
        Matrix.events.emit('sensor-emit', data);
      });

      sensor.stderr.on('data', function(data){
        error('Sensor Initialization Error'.red, data.toString());
        Matrix.events.emit('sensor-error', data.toString());
      });
    }
  },
  killAllSensors: function(cb){
    _.each(Matrix.activeSensors, function (p) {
      stopSensor( p );
    })

    if (_.isFunction(cb)){
      cb(null);
    }
  }
}
