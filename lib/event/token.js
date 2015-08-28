module.exports = {
  init : function(){
    Matrix.events.on('token-refresh', function(state){
      log('Token Refresh:'.green,
      '\n(client)'.yellow, state.client.token,
      '\n(device)'.yellow, state.device.token);
      Matrix.service.token.set({
        clientToken: state.client.token,
        deviceToken: state.device.token
      });
    });
  }
}
