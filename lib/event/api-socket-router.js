function apiConnectionListener() {
  console.log('I hear API')
  Matrix.state.apiConnected = true;
}

// router for control message from API
function apiDataListener(data) {
  log('[M]'.green + 'ev>api-data |', data );
  // incoming from server
  // prepare for sockets / rest spitting data
  if (data.type === 'app.start') {
    Matrix.service.manager.start(data.value, function(err, childProcess) {
      if (err) console.error(err);
      // console.log( 'forked process > ', childProcess);
      Matrix.events.emit('app-register', childProcess);
    });
  } else if (data.type === 'app.stop'){
    Matrix.service.manager.stop(data.value)
  } else if (data.type === 'heartbeat') {
    Matrix.events.emit('heart-beat', data);
    Matrix.events.emit('heart-beat', data);
  }
  // type: data, utility, update, heartbeat, etc


}

var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;



function apiSendListener(data){
  // returns to API server
  console.log('api-send');
  //TODO:  Matrix.socket.emit(data);

}

var socket;

module.exports = {
  init: function doApiEvent() {
    Matrix.events.on('api-connect', apiConnectionListener);
    Matrix.events.on('api-data', apiDataListener);
    Matrix.events.on('api-send', apiSendListener);
  }
}
