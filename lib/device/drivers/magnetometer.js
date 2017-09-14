var DeviceDriver, SenseDriver;

var debug = debugLog('magnetometer');

module.exports = {
  commands: ['magnetometer'],
  // init runs automatically, wait for app to request component creation
  init: function () {
    DeviceDriver = Matrix.service.protobuf.malos.driver;
    // Parse matrix_malos package (namespace).
    SenseDriver = Matrix.service.protobuf.malos.sense;
  },
  read: function (buffer) {
    var m = new SenseDriver.Imu.decode(buffer);
    return { x: m.mag_x, y: m.mag_y, z: m.mag_z };
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
    debug('gyro start');
    cb(driverConfigProto.encode().toBuffer());
  },
  ping: function () {
    if (_.has(Matrix.components, 'magnetometer')) {
      Matrix.components.magnetometer.ping();
    } else {
      console.log('Magnetometer available, not activated.');
    }
  }
};