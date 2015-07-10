
function heartbeatListener( response ){
  log('heartbeat <3'.green, response);
}


function init(){
  Matrix.events.on('heartbeat-response', heartbeatListener)
}



module.exports = {
  init: init
}