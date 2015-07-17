function apiConnectionListener() {
  console.log('I hear API')
  Matrix.state.apiConnected = true;
}

function apiDataListener(data) {

  log('[M]'.green + 'ev>api-data |', data );
  // incoming from server
  // prepare for sockets / rest spitting data
  if (data.type === 'utility.start') {
    Matrix.service.manager.start(data.value, function(childProcess) {
      // console.log( 'forked process > ', childProcess);
    });
  } else if (data.type === 'utility.stop'){
    Matrix.service.manager.stop(data.value)
  }
  // type: data, utility, update, heartbeat, etc


}


module.exports = {
  init: function doApiEvent() {
    Matrix.events.on('api-connect', apiConnectionListener);
    Matrix.events.on('api-data', apiDataListener);
  }
}
