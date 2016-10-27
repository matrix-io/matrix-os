var debug = debugLog('event>services')

module.exports = {
  init: function(){
    Matrix.events.on('service-init', Matrix.device.service.start )
    Matrix.events.on('service-emit', serviceEmitHandler)
  }
}

function serviceEmitHandler(msg){
<<<<<<< HEAD
  debug('Service Emit>', msg)
  // list of apps which detect this object
  var targetApplications = _.filter(Matrix.activeApplications, function(app) {
    var svs = _.values(app.services);
    svs = _.filter(svs, function(s){
      return ( s.type === msg.type && s.engine === msg.engine )
    })
    return !_.isEmpty(svs);
  })

  debug('Target Applications', _.map(targetApplications, 'name') );
  _.each(targetApplications, function(proc) {

    var payload = _.omit(msg, 'type','engine','enumName');
=======
  debug('Detection>', msg)
  // list of apps which detect this object
  var targetApplications = _.filter(Matrix.activeApplications, function(app) {
    debug( 'service check:', app.services, 'type=?'.blue, msg.type );
    if ( app.hasOwnProperty('services') ){
      return ( _.map(app.services, 'type').indexOf(msg.type) > -1 );
    }
  })

  var payload = _.omit(msg, 'type');

  debug('Target Applications', _.map(targetApplications, 'name') );

  _.each(targetApplications, function(proc) {
>>>>>>> Gesture inits via malos
    // sends to child process
    debug('[service-emit]>', payload)
    proc.process.send({
      eventType: 'service-emit',
      type: msg.type,
      payload: payload
    });
  });
}
