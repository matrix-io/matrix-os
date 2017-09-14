var DeviceDriver;

var debug = debugLog('altitude');

module.exports = {
  // init runs automatically, wait for app to request component creation
  init: function () {
    DeviceDriver = Matrix.service.protobuf.malos.driver;
  },
  read: function (buffer) {
    return {
      value: new DeviceDriver.Pressure.decode(buffer).altitude
    };
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
      options.timeout = 15.0;
    } else if (parseFloat(options.timeout) === options.timeout) {
      options.timeout = options.timeout / 1000;
    }

    // map options to protobuf config
    var driverConfigProto = new DeviceDriver.DriverConfig;
    // 2 seconds between updates.
    driverConfigProto.delay_between_updates = options.refresh;
    // Stop sending updates 6 seconds after pings.
    driverConfigProto.timeout_after_last_ping = options.timeout;
    debug('altitude start');
    cb(driverConfigProto.encode().toBuffer());
  },
  ping: function () {
    if (_.has(Matrix.components, 'altitude')) {
      Matrix.components.altitude.ping();
    } else {
      console.log('Temperature available, not activated.');
    }
  }
};