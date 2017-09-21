var DeviceDriver, SenseDriver;

var debug = debugLog('temperature');

module.exports = {
  commands: ['temperature'],
  // init runs automatically, wait for app to request component creation
  init: function () {
    DeviceDriver = Matrix.service.protobuf.malos.driver;
    // Parse matrix_malos package (namespace).
    SenseDriver = Matrix.service.protobuf.malos.sense;
  },
  read: function (buffer) {
    return { value: new SenseDriver.Humidity.decode(buffer).temperature };
  },
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
      options.refresh = options.refresh / 1000;
    }
    if (!_.has(options, 'timeout')) {
      options.timeout = 3.0;
    } else if (parseFloat(options.timeout) === options.timeout) {
      options.timeout = options.timeout / 1000;
    }

    // map options to protobuf config
    var config = new DeviceDriver.DriverConfig;
    // 2 seconds between updates.
    config.delay_between_updates = options.refresh;
    // Stop sending updates 6 seconds after pings.
    config.timeout_after_last_ping = options.timeout;
    debug('temperature start');
    cb(DeviceDriver.DriverConfig.encode(config).finish());
  },
  ping: function () {
    if (_.has(Matrix.components, 'temperature')) {
      Matrix.components.temperature.ping();
    } else {
      console.log('Temperature available, not activated.');
    }
  }
};