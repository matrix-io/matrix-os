var debug = debugLog('event>detections')

module.exports = {
  init: function(){
    Matrix.events.on('detection-init', Matrix.device.detection.start )
    Matrix.events.on('detection-emit', detectionEmitHandler)
  }
}

function detectionEmitHandler(msg){
  debug('Detection>', msg)
  // list of apps which detect this object
  var activeApplications = _.filter(Matrix.activeApplications, function(app) {
    debug( app.detections, '=?'.blue, msg.type );
    if ( app.hasOwnProperty('detections')){
      return ( app.detections.indexOf(msg.type) > -1 );
    }
  })

  var payload = _.omit(msg, 'type');

  debug('Target Applications', _.map(activeApplications, 'name') );

  _.each(activeApplications, function(proc) {
    // sends to child process
    debug('[detection-emit]>', payload)
    proc.process.send({
      eventType: 'detection-emit',
      type: msg.type,
      payload: payload
    });
  });
}
