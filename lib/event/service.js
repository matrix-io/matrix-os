var debug = debugLog('event>service')

module.exports = {
  init: function() {
    Matrix.events.on('service-init', Matrix.device.service.start);
    Matrix.events.on('service-emit', serviceEmitHandler);
    Matrix.events.on('service-cmd', Matrix.device.service.cmdHandler);
  }
}

// maps service messages to applications
/**
 * 
 * @param {} msg 
 * @param {} msg.engine - what engine it uses 
 * @param {} msg.type   - what engine subset it uses
 * @param {} msg.enumName - was used for heartbeat, probably not necessary 
 * @param {} msg.serviceType - for routing on the application layer
 */

function serviceEmitHandler(msg) {
  debug('Begin Service Emit>', msg)

  // use configured services to list apps which detect this object
  var targetApplications = _.filter(Matrix.activeApplications, function(app) {
    var svs = _.values(app.services);
    svs = _.filter(svs, function(s) {
      return (s.type === msg.type && s.engine === msg.engine)
    })
    return !_.isEmpty(svs);
  })

  debug('Target Applications', _.map(targetApplications, 'name'));

  _.each(targetApplications, function(proc) {
    // sends to child process
    debug('[service-emit]>' + '(%s)'.blue, proc.name, msg)
    var sendObj = {
      // routes to lib/service.js
      eventType: 'service-emit',
      // routes within lib/service.js
      payload: msg.payload
    };

    if (_.has(msg, 'serviceType')) {
      sendObj.serviceType = msg.serviceType;
    }

    proc.process.send(sendObj);
  });
}