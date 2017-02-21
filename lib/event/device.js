var debug = debugLog('device events')

module.exports = {
  init: function(){
    Matrix.events.on('gpio-emit', gpioEmitListener);
    Matrix.events.on('gpio-open', Matrix.device.gpio.open);
    Matrix.events.on('gpio-write', Matrix.device.gpio.write);
    Matrix.events.on('zigbee-light', Matrix.device.drivers.zigbee.lightHandler );
    Matrix.events.on('zigbee-net', Matrix.device.drivers.zigbee.netHandler );
  }
}

function gpioEmitListener( data ){
  debug('(gpio-emit)->', data);

  var targetApplications = _.filter( Matrix.activeApplications, function (a){
    if ( _.has( a, 'integrations' ) && !_.isUndefined(a.integrations) ){
      return ( a.integrations.indexOf('gpio') > -1 );
    }
  })

  if ( targetApplications.length === 0 ){
    debug('GPIO Event with No Application Listener', data);
  }

  _.each(targetApplications, function (p) {
    p.process.send({
      eventType: 'gpio-emit',
      payload: data
    })
  })
}
