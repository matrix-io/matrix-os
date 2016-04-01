

var debug = debugLog('device-sensor')


function stopSensor( sensor ){
  if ( _.isString(sensor)){
    warn('stopSensor is not implemented yet fro string')
  } else if (_.isObject(sensor)){
    // processes
    Matrix.device.process.kill(sensor.id);
  }
}

var sensorTypeList = [
  'temperature',
  'humidity',
  'gyroscope',
  'accellerometer',
  'nfc'
]

module.exports = {
  installType: function(type){
    // TODO: DO SENSOR LOOKUP FROM AVAILABLE SENSORS
    // TODO: .install appropriate model
  },
  install: function(model){

    debug('[SENSOR INSTALL]>', model)
    // assume model = 39md
    if ( sensorTypeList.indexOf(model) > -1 ){
      // they passed a type
      // TODO lookup local sensors
      console.warn(model, 'is a sensor type, model lookup not yet supported, test only')
    }

    // TODO: lookup from local db

    var Registry = require('npm-registry');
    var npm = new Registry({ registry: 'http://registry.npmjs.org'});

    var installed = false;
    npm.packages.keyword('matrix-os', function (err, data) {
      if (err) return console.error('NPM lookup error', err);

      if (_.isEmpty(data) ) return console.error('No Matrix Modules Found. [:<]')
      // TODO: save to db
      data.forEach(function (d) {
        var moduleName = d.name;
        // assuming matrix.40rd.temperature.sensor
        var c = moduleName.split('-');
        if (c[0] === 'matrix' && c[3] === 'sensor'){
          // TODO: this is a hack to support a demo, shouldn't fire on first type match
          if ( c[1] === model || c[2] === model){
            // match for model
            try {
              require('child_process').execSync('npm install ' + moduleName)
            } catch(e){
              console.error('Sensor Install Error', e);
            }
            console.log(moduleName, 'installed as a', c[2], 'sensor')
            installed = true;

            //TODO:  save model and type to local db
          }
        }
      });
      if ( installed === false ){
        console.warn('No sensor found for', model);
      }
    });

  },
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
