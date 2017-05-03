var protoBuilder, matrixMalosBuilder;

var debug = debugLog('humidity')

module.exports = {
  commands: ['humidity'],
  // init runs automatically, wait for app to request component creation
  init: function() {
    protoBuilder = Matrix.service.protobuf.malos.driver
      // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')
  },
  read: function(buffer) {
    return { value: new matrixMalosBuilder.Humidity.decode(buffer).humidity }
  },
  prepare: function(options, cb) {
    if (_.isFunction(options)) {
      cb = options;
      options = {};
    }
    if (_.isUndefined(options)) {
      options = {};
    }

    if (!_.has(options, 'refresh')) {
      options.refresh = 0.05;
    } else if (parseFloat(options.refresh) === options.refresh) {
      options.refresh = Math.max(0.05, options.refresh / 1000)
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
    debug('humidity start')
    cb(driverConfigProto.encode().toBuffer());
  },
  ping: function() {
    if (_.has(Matrix.components, 'humidity')) {
      Matrix.components.humidity.ping();
    } else {
      console.error('Temperature available, not activated.');
    }
  }
}