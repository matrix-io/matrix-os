var DeviceDriver, matrixMalosBuilder;

var debug = debugLog('gyroscope');

module.exports = {
  commands: ['gyroscope'],
  // init runs automatically, wait for app to request component creation
  init: function () {
    DeviceDriver = Matrix.service.protobuf.malos.driver;
    // Parse matrix_malos package (namespace).
    SenseDriver = Matrix.service.protobuf.malos.sense;
  },
  read: function (buffer) {
    var g = SenseDriver.Imu.decode(buffer);
    return {
      // orientation values sent with gyro
      yaw: g.yaw,
      pitch: g.pitch,
      roll: g.roll,
      x: g.gyroX,
      y: g.gyroY,
      z: g.gyroZ
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
    var config = new DeviceDriver.DriverConfig;
    // 2 seconds between updates.
    config.delayBetweenUpdates = options.refresh;
    // Stop sending updates 6 seconds after pings.
    config.timeoutAfterLastPing = options.timeout;
    debug('gyro start');
    cb(DeviceDriver.DriverConfig.encode(config).finish());
  },
  ping: function () {
    if (_.has(Matrix.components, 'gyroscope')) {
      Matrix.components.gyroscope.ping();
    } else {
      console.log('Gyroscope available, not activated.');
    }
  }
};