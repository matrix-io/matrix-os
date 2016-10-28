var debug = debugLog('event>service')

module.exports = {
  init: function(){
    Matrix.events.on('service-init', Matrix.device.service.start )
    Matrix.events.on('service-emit', serviceEmitHandler)
  }
}

function serviceEmitHandler(msg){
  debug('Service Emit>', msg)
  // list of apps which detect this object
  var targetApplications = _.filter(Matrix.activeApplications, function(app) {
    debug( 'service check:', app.services, 'type=?'.blue, msg.type );
    if ( app.hasOwnProperty('services') && !_.isUndefined(app.services) ){
      return ( _.map(app.services, 'type').indexOf(msg.type) > -1 );
    }
  })

  var payload = _.omit(msg, 'type');

  debug('Target Applications', _.map(targetApplications, 'name') );

  _.each(targetApplications, function(proc) {
    // sends to child process
    debug('[service-emit]>', payload)
    proc.process.send({
      eventType: 'service-emit',
      type: msg.type,
      payload: payload
    });
  });
}
