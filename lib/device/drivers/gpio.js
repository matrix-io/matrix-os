var protoBuilder, matrixMalosBuilder;

var debug = debugLog('gpio')
var pinAmount = 17;

module.exports = {
  commands: ['gpio'],
  // init runs automatically, wait for app to request component creation
  init: function () {
    protoBuilder = Matrix.service.protobuf.malos.driver
    // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')
  },
  read: function (buffer) {
    var buffer = new matrixMalosBuilder.GpioParams.decode(buffer);
    return {
      pin: buffer.pin, //set_pin 
      value: buffer.value, //set_value
      mode: buffer.mode, //set_mode(matrixMalosBuilder.GpioParams.EnumMode.OUTPUT)
      values: buffer.values
    }
  },
  send: function(pin, value, callback) {
    debug('send=>', value);
      
    var gpioHandler = new matrixMalosBuilder.GpioParams;
    var buffer = gpioHandler.decode(buffer);
    gpioHandler.set_mode(matrixMalosBuilder.GpioParams.EnumMode.OUTPUT);

    if (!_.isUndefined(pin)) {
      if (_.isArray(pin)) {
        //#Overload pin = pins array
        gpioHandler.set_pins(true); //TODO Still not supported by the protos
        gpioHandler.set_values(pin); //TODO Still not supported by the protos
        callback(null, gpioHandler.encode().toBuffer());
      } else if (_.isInteger(pin) && pin > 0 && pin < pinAmount && _.isInteger(value)) {
        gpioHandler.set_pin(pin);
        gpioHandler.set_value(value);
        callback(null, gpioHandler.encode().toBuffer());
      } else {
        //Incorrect format
        callback(new Error('Incorrectly formatted params'));
      }
    } else {
      callback(new Error('Need to provide params'));
    }


  },
  /**
   * prepare gpio protobufs
   * @param  []   options.pin   pin to setup for reading/writing
   * @param  {Function} cb      [description]
   * @return {[type]}           [description]
   */

  prepare: function (options, cb) {
    if (_.isFunction(options)) {
      cb = options;
      options = {};
    }
    if (_.isUndefined(options)) {
      options = {};
    }

    if (!_.has(options, 'refresh')) {
      options.refresh = 1.0;
    } else if (parseFloat(options.refresh) === options.refresh) {
      options.refresh = options.refresh / 1000
    }
    if (!_.has(options, 'timeout')) {
      options.timeout = 15.0;
    } else if (parseFloat(options.timeout) === options.timeout) {
      options.timeout = options.timeout / 1000
    }

    // map options to protobuf config
    var driverConfigProto = new matrixMalosBuilder.DriverConfig
    // 2 seconds between updates.
    driverConfigProto.delay_between_updates = options.refresh;
    // Stop sending updates 6 seconds after pings.
    driverConfigProto.timeout_after_last_ping = options.timeout;
    debug('gpio start')
      
    if (!_.has(options, 'pin')) {
      
    }
    cb(driverConfigProto.encode().toBuffer());
  },
  ping: function () {
    if (_.has(Matrix.components, 'gpio')) {
      Matrix.components.gpio.ping();
    } else {
      console.error('No GPIO Component Available for Ping')
    }
  }
}