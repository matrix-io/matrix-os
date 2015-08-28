module.exports = {
  init : function(){
    Matrix.events.on('token-refresh', function(state){
      log('Token Refresh:'.green)
      log('(client)'.yellow, state.client.token);
      log('(device)'.yellow, state.device.token);
      Matrix.service.token.set({
        clientToken: state.client.token,
        deviceToken: state.device.token
      });
    });
  }
}
