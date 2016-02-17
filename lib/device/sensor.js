module.exports = {
  init: function(options){
    if ( _.isUndefined(options)){
      // init() is called on startup
    } else {
      // init() called from app
      debug('Sensor.init(', options);
    }
  }
}
