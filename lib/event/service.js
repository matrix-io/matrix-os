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
    var svs = _.values(app.services);
    svs = _.filter(svs, function(s){
      return ( s.type === msg.type && s.engine === msg.engine )
    })
    return !_.isEmpty(svs);
  })

  debug('Target Applications', _.map(targetApplications, 'name') );
  _.each(targetApplications, function(proc) {

    var payload = _.omit(msg, 'type','engine','enumName');
    // sends to child process
    debug('[service-emit]>', payload)
    proc.process.send({
      eventType: 'service-emit',
      type: msg.type,
      payload: payload
    });
  });
}
