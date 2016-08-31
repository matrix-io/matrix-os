

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
  'nfc',
  'pressure',
  'uv',
  'altitude'
]

module.exports = {
  installType: function(type){
    // TODO: DO SENSOR LOOKUP FROM AVAILABLE SENSORS
    // TODO: .install appropriate model
  },
  install: function(model){
    console.warn('Sensor Install is not working now.')
    debug('[SENSOR INSTALL]>', model)
    // assume model = 39md
    // if ( sensorTypeList.indexOf(model) > -1 ){
    //   // they passed a type
    //   // TODO lookup local sensors
    //   console.warn(model, 'is a sensor type, model lookup not yet supported, test only')
    // }
    //
    // // TODO: lookup from local db
    //
    // var Registry = require('npm-registry');
    // var npm = new Registry({ registry: 'http://registry.npmjs.org'});
    //
    // var installed = false;
    // npm.packages.keyword('matrix-os', function (err, data) {
    //   if (err) return console.error('NPM lookup error', err);
    //
    //   if (_.isEmpty(data) ) return console.error('No Matrix Modules Found. [:<]')
    //   // TODO: save to db
    //   data.forEach(function (d) {
    //     var moduleName = d.name;
    //     // assuming matrix.40rd.temperature.sensor
    //     var c = moduleName.split('-');
    //     if (c[0] === 'matrix' && c[3] === 'sensor'){
    //       // TODO: this is a hack to support a demo, shouldn't fire on first type match
    //       if ( c[1] === model || c[2] === model){
    //         // match for model
    //         try {
    //           require('child_process').execSync('npm install ' + moduleName)
    //         } catch(e){
    //           console.error('Sensor Install Error', e);
    //         }
    //         console.log(moduleName, 'installed as a', c[2], 'sensor')
    //         installed = true;
    //
    //         //TODO:  save model and type to local db
    //       }
    //     }
    //   });
    //   if ( installed === false ){
    //     console.warn('No sensor found for', model);
    //   }
    // });

  },
  start: function(options){

    debug('device.sensor.start>', options);

    if (sensorTypeList.indexOf(options.name) === -1 ){
      return warn('No Matching Sensor Found', options.name)
    }

    if ( Matrix.activeSensors.indexOf(options.name) !== -1 ){
      return warn('Duplicate Sensor Initialization', options.name)
    }

    Matrix.activeSensors.push(options.name);

    // fetches the zero mq connections in a keyed object { config, update, ping... }
    var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers[options.name]);

    // put connections in options for component
    _.merge(options, mqs);

    var component = new Matrix.service.component(options);

    component.send(options.options, function(){
      // after sensor is configured, handle data events
      if ( component.sensor === true ){
        component.read( function(data){

          debug('.read>', data);

          // for re-routing to apps on the other side of emit
          data.type = options.name;

          // Forward back to the rest of the Application
          Matrix.events.emit('sensor-emit', data);

        })
      }
    });
  },
  killAllSensors: function(cb){
    _.each(Matrix.activeSensors, function (p) {
      // Zeromq.removeSubscriber(p
    })

    if (_.isFunction(cb)){
      cb(null);
    }
  },
  stop: function(name){
    // Zeromq.removeSubscriber(name);
  }
}
