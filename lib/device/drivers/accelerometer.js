var protoBuilder, DeviceDriver;

var debug = debugLog('accelerometer')

module.exports = {
  commands: ['accelerometer'],
  // init runs automatically, wait for app to request component creation
  init: function () {
    DeviceDriver = Matrix.service.protobuf.malos.driver
  },
  read: function (buffer) {
    var a = new DeviceDriver.Imu.decode(buffer)
    return { x: a.accel_x, y: a.accel_y, z: a.accel_z };
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
      options.refresh = options.refresh / 1000
    }
    if (!_.has(options, 'timeout')) {
      options.timeout = 15.0;
    } else if (parseFloat(options.timeout) === options.timeout) {
      options.timeout = options.timeout / 1000
    }

    // map options to protobuf config
    var driverConfigProto = new DeviceDriver.DriverConfig
    // 2 seconds between updates.
    driverConfigProto.delay_between_updates = options.refresh;
    // Stop sending updates 6 seconds after pings.
    driverConfigProto.timeout_after_last_ping = options.timeout;
    debug('gyro start')
    cb(driverConfigProto.encode().toBuffer());
  },
  ping: function () {
    if (_.has(Matrix.components, 'accelerometer')) {
      Matrix.components.accelerometer.ping();
    } else {
      console.log('Accelerometer available, not activated.');
    }
  }
}