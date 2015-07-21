module.exports = {
  init: function(){
    Matrix.events.on('sensor-event', sensorEventListener );
  }
}

function sensorEventListener( data ){
  console.log('[M]->ev:sensor-event'.green, data);
  // filter data
  var Filter = require('admobilize-eventfilter-sdk').EventFilter;
  var applyFilter = require('admobilize-eventfilter-sdk').apply;

  var tempFilter = new Filter('temperature');

  tempFilter.has('value').between(32, 68);


  var filtered = applyFilter( tempFilter, data );

  console.log('Filter'.yellow, tempFilter.json());
  if (filtered) {
    console.log('good:'.green, filtered);
  } else {
    log('bad'.red, data);
  }
  // send to api
}
