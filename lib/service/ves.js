module.exports = {
  spawn: function( name, options ){
    log('VES IN')
    Matrix.service.firebase.ves.init({
      userId: Matrix.userId,
      deviceId: Matrix.deviceId,
      deviceRecordId: Matrix.deviceRecordId,
      deviceSecret: Matrix.deviceSecret,
      token: Matrix.token
    }, function(err, conf){
      if(err) console.error(err);
      console.log("==========VES".red, conf)
      // TODO:recieves server ready configuration from VES
      // TODO:update config with options
      // TODO:turn on camera and send video to VES server
    })
  }
}
