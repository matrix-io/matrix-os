var protoBuilder, matrixMalosBuilder;

var debug = debugLog('gyro')

module.exports = {
  read: function(cb){
    debug('gyro read');

    Matrix.service.zeromq.gyro.update(function(buffer){
      debug('gyro->', buffer);
      var imuData = new matrixMalosBuilder.Imu.decode(buffer)
      debug('gyro->', imuData);
      cb(imuData);
    });

    // ping!
    Matrix.service.zeromq.gyro.ping();
  },
  init: function(options, cb){
    if (_.isFunction(options)){
      cb = options
    }

    protoBuilder = Matrix.service.protobuf.malos.driver
    // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')

    var driverConfigProto = new matrixMalosBuilder.DriverConfig
    // 2 seconds between updates.
    driverConfigProto.delay_between_updates = 0.1
    // Stop sending updates 6 seconds after pings.
    driverConfigProto.timeout_after_last_ping = 60.0
    Matrix.service.zeromq.gyro.config(driverConfigProto.encode().toBuffer());
    debug('gyro init')
    if ( _.isFunction(cb)){
      cb();
    }
  }
}
