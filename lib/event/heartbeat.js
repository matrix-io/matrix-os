
function heartbeatListener( response ){
  log('heartbeat <3'.green, response);
}


function init(){
  Matrix.events.on('heart-beat', heartbeatListener)
}



module.exports = {
  init: init
}