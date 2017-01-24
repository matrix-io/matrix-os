var protoBuilder, matrixMalosBuilder;

var debug = debugLog('ir');

module.exports = {
  init: function(){
    protoBuilder = Matrix.service.protobuf.malos.driver
    // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')
  },
  read: function(buffer){
    console.log('ir read', buffer)
    return {
      value: new matrixMalosBuilder.LircParams.decode(buffer).pressure
    }
  },
  send: function(message){
    var irCmd = new matrixMalosBuilder.LircParams;
    irCmd.device = 'SONY';
    irCmd.command = 'KEY_POWER';
    var config = new matrixMalosBuilder.DriverConfig;
    config.set_lirc(irCmd)

    Matrix.components.ir.print(config.encode().toBuffer());
  },
  prepare: function(options, cb){
    if (_.isFunction(options)){
      cb = options;
      options = {};
    }
    if (_.isUndefined(options)){
      options = {};
    }

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

    var irCmd = new matrixMalosBuilder.LircParams;
    irCmd.device = 'SONY';
    irCmd.command = 'KEY_POWER';
    var config = new matrixMalosBuilder.DriverConfig;
    config.delay_between_updates =  options.refresh;
    // Stop sending updates 6 seconds after pings.
    config.timeout_after_last_ping = options.timeout;
    config.set_lirc(irCmd)

    debug('prepare', config);
    cb(config.encode().toBuffer());
  },
  ping: function(){
    if ( _.has(Matrix.components, 'ir')){
      Matrix.components.ir.ping();
    } else {
      console.error('No IR Component Available for Ping')
    }
  }
}
