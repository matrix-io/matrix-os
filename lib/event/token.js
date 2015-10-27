// todo: handle expired tokens

module.exports = {
  init : function(){
    Matrix.events.on('token-refresh', function(state){
      log('Token Refresh:'.green);
      // log('(client)'.yellow, state.client.token);
      log('(device)'.yellow, state.device.token);
      if ( _.isUndefined( state.client.token ) || _.isUndefined( state.device.token ) ){
        console.error('Client or Device Token Not Set for (token-refresh)'.red);
      }
      Matrix.service.token.set({
        // clientToken: state.client.token,
        deviceToken: state.device.token
      });
    });
  }
}
