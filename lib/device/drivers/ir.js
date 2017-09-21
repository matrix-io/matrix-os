var DeviceDriver, SenseDriver;

var debug = debugLog('ir');

module.exports = {
  init: function () {
    DeviceDriver = Matrix.service.protobuf.malos.driver;
    // Parse matrix_malos package (namespace).

    SenseDriver = Matrix.service.protobuf.malos.sense;
  },
  read: function (buffer) {
    return {
      value: new SenseDriver.LircParams.decode(buffer).pressure
    };
  },
  send: function (message) {
    // doesn't work yet
    var msg = new SenseDriver.LircParams();
    msg.proto.device = '';
    msg.proto.command = '';
    // Matrix.components.ir.send(SenseDriver.LircParams.encode(msg).finish());
    return console.warn('IR.Send is not working yet')
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
    config.delay_between_updates = options.refresh;
    // Stop sending updates 6 seconds after pings.
    config.timeout_after_last_ping = options.timeout;
    debug('ir start');

    cb(DeviceDriver.DriverConfig.encode(config).finish());
  },
  ping: function () {
    if (_.has(Matrix.components, 'ir')) {
      Matrix.components.ir.ping();
    } else {
      console.log('IR available, not activated.');
    }
  }
};