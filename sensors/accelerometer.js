var sensors = require('adsensors');

module.exports = {
  start: function(cb){
    setInterval( function() {
      sensors.test(function(err, d){
        if (err) return cb(err);
        Matrix.events.emit('sensor-emit', d);
        cb(null, d);
      });
    }, config.sensorRefresh )
  }
};
