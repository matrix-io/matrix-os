module.exports  = {
  authenticate: function(token, cb){
    Matrix.api.authenticate({
      clientId : Matrix.clientId,
      clientSecret : Matrix.clientSecret,
      apiServer: Matrix.apiServer
    }, function(err, state){
      if (err) cb(err);
      Matrix.events.emit('token-refresh', state.client.token);
      cb(null, state.client.token);
    });
  }
}
