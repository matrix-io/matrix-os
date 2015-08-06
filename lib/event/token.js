module.exports = {
  init : function(){
    Matrix.events.on('token-refresh', function(token){
      log('Token Refresh:'.green, token);
      Matrix.token = token;
      Matrix.service.token.set(token);
    });
  }
}
