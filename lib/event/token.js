// todo: handle expired tokens

module.exports = {
  init : function(){
    Matrix.events.on('token-refresh', function(state){
      log('Token Refresh:'.green);
      if ( _.isUndefined( state.user.token ) ){
        console.error('User Token Not Set for (token-refresh)'.red);
      }
      Matrix.service.token.set({
        deviceToken: state.device.token,
        deviceSecret: state.device.secret,
        token: state.user.token,
        userId: state.user.id
      });
    });
  }
}
