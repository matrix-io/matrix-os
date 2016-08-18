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
  start: function(options, cb){
    if (_.isFunction(options)){
      cb = options;
      options = {};
    }
    if (_.isUndefined(options)){
      options = {};
    }

    protoBuilder = Matrix.service.protobuf.malos.driver
    // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')

    if ( !_.has(options, 'refresh')){
      options.refresh = 1.0;
    } else if ( parseFloat(options.refresh) === options.refresh ){
      options.refresh = options.refresh / 1000
    }
    if ( !_.has(options, 'timeout')){
      options.timeout = 15.0;
    } else if ( parseFloat(options.timeout) === options.timeout ){
        options.timeout = options.timeout / 1000
    }

    var driverConfigProto = new matrixMalosBuilder.DriverConfig
    // 2 seconds between updates.
    driverConfigProto.delay_between_updates =  options.refresh;
    // Stop sending updates 6 seconds after pings.
    driverConfigProto.timeout_after_last_ping = options.timeout;
    Matrix.service.zeromq.gyro.config(driverConfigProto.encode().toBuffer());
    debug('gyro start')
    if ( _.isFunction(cb)){
      cb();
    }
  }
}
