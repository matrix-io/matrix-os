var DeviceDriver, SenseDriver;

var debug = debugLog('gpio')
var pinAmount = 16;

module.exports = {
  commands: ['gpio'],
  // init runs automatically, wait for app to request component creation
  init: function () {
    DeviceDriver = Matrix.service.protobuf.malos.driver;
    SenseDriver = Matrix.service.protobuf.malos.sense;
    IODriver = Matrix.service.protobuf.malos.io;
  },
  read: function (buffer) {
    var buffer = new SenseDriver.GpioParams.decode(buffer);
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
    var config = new DeviceDriver.DriverConfig

    if (options.servo === true && pin < pinAmount) {
      var servoHandler = new IODriver.ServoParams;
      servoHandler.pin(pin);
      servoHandler.angle(value);
      config.servo(servoHandler)
      return cb(DeviceDriver.DriverConfig.encode(config).finish());
    }

    var gpioHandler = new matrixMalosBuilder.GpioParams;
    gpioHandler.set_mode(matrixMalosBuilder.GpioParams.EnumMode.OUTPUT);

    if (!_.isUndefined(pin)) {
      if (_.isArray(pin)) { //#Overload pin = pins array //TODO This will eventually be supported by the protos
        debug('SETTING ALL PINS');
        gpioHandler.pins = true; //TODO Still not supported by the protos
        gpioHandler.values = pin; //TODO Still not supported by the protos
        config.gpio = gpioHandler;
        return cb(DeviceDriver.DriverConfig.encode(config).finish());
      } else if (_.isInteger(pin) && pin >= 0 && pin < pinAmount && _.isInteger(value)) {
        debug('SETTING PIN #', pin);
        gpioHandler.pin = pin;
        gpioHandler.value = value;
        config.gpio = gpioHandler;
        return cb(DeviceDriver.DriverConfig.encode(config).finish());
      } else {
        //Incorrect format
        debug('Incorrect format!');
        cb(new Error('Incorrectly formatted params'));
      }
    } else {
      debug('Need to provide params!');
      return cb(new Error('Need to provide params'));
    }
  },
  ping: function () {
    if (_.has(Matrix.components, 'gpio')) {
      Matrix.components.gpio.ping();
    } else {
      console.error('GPIO available, not activated.');
    }
  }
}