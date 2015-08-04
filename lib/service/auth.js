module.exports  = {
  authenticate: function(token, cb){
    Matrix.api.authenticate({
      clientId : Matrix.clientId,
      clientSecret : Matrix.clientSecret,
      apiServer: Matrix.apiServer
    }, function(err, state){
      if (err) cb(err);
      Matrix.service.token.set(state.client.token);
      Matrix.events.emit('token-refresh');
      Matrix.token = token;
      cb(null, token.token);
    });
  }
}
