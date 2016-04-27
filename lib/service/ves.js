module.exports = {
  spawn: function( options ){
    Matrix.service.firebase.ves.init( Matrix.userId, Matrix.deviceId, Matrix.token, function(conf){
      // TODO:recieves server ready configuration from VES
      // TODO:update config with options
      // TODO:turn on camera and send video to VES server
    })
  }
}
