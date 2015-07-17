module.exports = {
  init : function(){
    Matrix.events.on('token-refresh', function(token){
      Matrix.token = token;
    });
  }
}
