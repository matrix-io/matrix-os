module.exports = {
  authenticate: function(token, cb) {
    Matrix.api.authenticate({
      clientId: Matrix.clientId,
      clientSecret: Matrix.clientSecret,
      apiServer: Matrix.apiServer,
      deviceId: Matrix.deviceId,
      deviceName: Matrix.deviceName,
      username: Matrix.username,
      password: Matrix.password
    }, function(err, state) {
      if (err) return cb(err);
      debug('auth state => '.green, state);
      Matrix.events.emit('token-refresh', state);
      cb(null, {
        userId: state.user.id,
        // clientToken: state.client.token,
        deviceSecret: state.user.token
      });
    });
  }
}
