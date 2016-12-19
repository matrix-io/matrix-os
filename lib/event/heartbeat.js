var debug = debugLog('heartbeat')

function heartbeatListener( d ){
  Matrix.lastHeartbeat = d;
  debug('💓->', d);
  // TODO: Resolve discrepancies between heartbeat and actives
  debug('M->services', Matrix.activeServices );
  debug('M->sensors', Matrix.activeSensors );
}


function init(){
  Matrix.events.on('heart-beat', heartbeatListener)
}

module.exports = {
  init: init
}
