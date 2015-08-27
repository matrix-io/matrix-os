module.exports = {
  init : function(){
    Matrix.events.on('token-refresh', function(state){
      log('Token Refresh:'.green, state);
      Matrix.service.token.set({
        clientToken: state.client.token,
        deviceToken: state.device.token
      });
    });
  }
}
