var protoBuilder, matrixMalosBuilder;

var debug = debugLog('gpio')
var pinAmount = 16;

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
  send: function (options) {
  },
  /**
   * prepare gpio protobufs
   * @param  []   options.pin   pin to setup for writing
   * @param  []   options.value value to write
   * @param  {Function} cb      [description]
   * @return {[type]}           [description]
   */

  prepare: function (options, cb) {
    debug('prepare=>', options);
    var pin = parseInt(options.pin);
    var value = parseInt(options.value);

    var gpioHandler = new matrixMalosBuilder.GpioParams;
    gpioHandler.set_mode(matrixMalosBuilder.GpioParams.EnumMode.OUTPUT);

    if (!_.isUndefined(pin)) {
      if (_.isArray(pin)) { //#Overload pin = pins array //TODO This will eventually be supported by the protos
        debug('SETTING ALL PINS');
        gpioHandler.set_pins(true); //TODO Still not supported by the protos
        gpioHandler.set_values(pin); //TODO Still not supported by the protos
        cb(gpioHandler.encode().toBuffer());
      } else if (_.isInteger(pin) && pin >= 0 && pin < pinAmount && _.isInteger(value)) {
        debug('SETTING PIN #', pin);
        gpioHandler.set_pin(pin);
        gpioHandler.set_value(value);
        var driverConfigProto = new matrixMalosBuilder.DriverConfig
        driverConfigProto.set_gpio(gpioHandler);
        cb(driverConfigProto.encode().toBuffer());
      } else {
        //Incorrect format
        debug('Incorrect format!');
        cb(new Error('Incorrectly formatted params'));
      }
    } else {
      debug('Need to provide params!');
      cb(new Error('Need to provide params'));
    }
  },
  ping: function () {
    if (_.has(Matrix.components, 'gpio')) {
      Matrix.components.gpio.ping();
    } else {
      console.error('No GPIO Component Available for Ping')
    }
  }
}