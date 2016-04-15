// todo: handle expired tokens

module.exports = {
  init : function(){
    Matrix.events.on('token-refresh', function(state){
      log('Token Refresh:'.green);
      // log('(client)'.yellow, state.client.token);
      log('(user)'.yellow, state.user.token);
      if ( _.isUndefined( state.user.token ) ){
        console.error('User Token Not Set for (token-refresh)'.red);
      }
      Matrix.service.token.set({
        // clientToken: state.client.token,
        // deviceToken: state.device.token
        token: state.user.token,
        userId: state.user.id
      });
    });
  }
}
