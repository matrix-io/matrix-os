

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
  'accelerometer',
  'magnetometer',
  'nfc',
  'pressure',
  'uv',
  'altitude',
  'ir',
  'face',
  'mic'
]




module.exports = {
  install: function(model){
    console.warn('Sensor Install is not working now.')
    debug('[SENSOR INSTALL]>', model)
  },
  start: function(options){

    debug('device.sensor.start>', options);

    // TODO: Need a consistent internal information for sensors up and down
    // Check for dupes

    if (sensorTypeList.indexOf(options.name) === -1 ){
      return console.error('No Matching Sensor Found'.red, options.name.yellow)
    }

    // we want apps to use multiple sensors TODO: remove, use heartbeat
    if ( Matrix.activeSensors.indexOf(options.name) !== -1 ){
      return console.error('Duplicate Sensor Initialization'.red, options.yellow)
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
