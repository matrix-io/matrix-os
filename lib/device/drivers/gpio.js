var protoBuilder, matrixMalosBuilder;

var debug = debugLog('gpio')

module.exports = {
  // init runs automatically, wait for app to request component creation
  init: function(){
    protoBuilder = Matrix.service.protobuf.malos.driver
    // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')
  },
  read: function(buffer){
    return {
      value: new matrixMalosBuilder.GpioParams.decode(buffer).altitude
    }
  },
  /**
   * prepare gpio protobufs
   * @param  []   options.readPins   list of pins to setup for reading
   * @param  []   options.writePins  list of pins to setup for writinging
   * @param  {Function} cb      [description]
   * @return {[type]}           [description]
   */

  prepare: function(options, cb){
    if (_.isFunction(options)){
      cb = options;
      options = {};
    }
    if (_.isUndefined(options)){
      options = {};
    }

    if ( !_.has(options, 'refresh')){
      options.refresh = 1.0;
    } else if ( parseFloat(options.refresh) === options.refresh ){
      options.refresh = options.refresh / 1000
    }
    if ( !_.has(options, 'timeout')){
      options.timeout = 15.0;
    } else if ( parseFloat(options.timeout) === options.timeout ){
        options.timeout = options.timeout / 1000
    }

    var pins = [];

    _.each( options.readPins, function(rp){
      var readPin = new matroxMalosBuilder.GpioParams;
      readPin.pin = rp;
      readPin.mode = 0;
      pins.push(readPin);
    });

    _.each( options.writePins, function(wp){
      var writePin = new matroxMalosBuilder.GpioParams;
      writePin.pin = rp;
      writePin.mode = 1;
      pins.push(readPin);
    });

    // map options to protobuf config
    var driverConfigProto = new matrixMalosBuilder.DriverConfig
    // 2 seconds between updates.
    driverConfigProto.delay_between_updates =  options.refresh;
    // Stop sending updates 6 seconds after pings.
    driverConfigProto.timeout_after_last_ping = options.timeout;
    debug('altitude start')
    cb(driverConfigProto.encode().toBuffer());
  },
  ping: function(){
    if ( _.has(Matrix.components, 'altitude')){
      Matrix.components.altitude.ping();
    } else {
      console.error('No Temperature Component Available for Ping')
    }
  }
}
