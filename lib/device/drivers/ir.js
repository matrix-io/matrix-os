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
    var msgProto = new SenseDriver.LircParams();
    msg.proto.device = '';
    msg.proto.command = '';
    Matrix.components.ir.send(msg.encode().toBuffer());
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
    debug('ir start');
    cb(driverConfigProto.encode().toBuffer());
  },
  ping: function () {
    if (_.has(Matrix.components, 'ir')) {
      Matrix.components.ir.ping();
    } else {
      console.log('IR available, not activated.');
    }
  }
};