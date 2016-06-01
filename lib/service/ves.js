var debug = debugLog('ves');

module.exports = {
  spawn: function( name, options ){
    debug('VES>'.grey)
    Matrix.service.firebase.ves.init({
      userId: Matrix.userId,
      username: Matrix.username,
      deviceId: Matrix.deviceId,
      deviceRecordId: Matrix.deviceRecordId,
      deviceSecret: Matrix.deviceSecret,
      streamingServer: Matrix.streamingServer,
      token: Matrix.token,
      schema: options.schema
    }, function(err, conf){
      if(err) console.error(err);
      debug('\n>VES'.grey, conf)
      // TODO:recieves server ready configuration from VES
      // TODO:update config with options
      // TODO:turn on camera and send video to VES server
    })
  }
}
