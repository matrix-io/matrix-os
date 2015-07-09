
function apiConnectionListener(){
  console.log('I hear API')
  Matrix.state.apiConnected = true;
}

module.exports = {
  init: function doApiEvent(){
    Matrix.events.on('api-connect', apiConnectionListener);
    console.log( Matrix.events )
  }
}