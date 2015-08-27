module.exports  = {
  authenticate: function(token, cb){
    Matrix.api.authenticate({
      clientId : Matrix.clientId,
      clientSecret : Matrix.clientSecret,
      apiServer: Matrix.apiServer,
      deviceId: Matrix.deviceId,
      deviceName: Matrix.deviceName
    }, function(err, state){
      if (err) cb(err);
      Matrix.events.emit('token-refresh', state);
      cb(null, state);
    });
  }
}
