require('colors');

var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;
var applyFilter = require('admobilize-eventfilter-sdk').apply;
var _ = require('lodash');

module.exports = {
  send: function(message) {
    process.send({
      type: 'sensor-emit',
      payload: message
    });
  },
  receive: receiveHandler,
  init: initSensor,
  emit: function(type, msg){
    process.send({
      type: type,
      payload: message
    });
  }
}



function receiveHandler(cb) {
  console.log('util receive');

  process.on('message', function(m) {
    cb(null, m);
  });

  process.on('error', function(err) {
    if (err) return cb(err);
  });

  process.on('disconnect', function(w) {
    console.log(appName, ': disconnect', w);
  });

  process.on('exit', function() {
    //handle exit
    console.log(appName, ': exit', arguments);
  });
}


function initSensor(name, options, cb) {
  console.log('Initialize:'.blue , name);

  process.send({
    type: 'sensor-init',
    name: name,
    options: options
  });

  var filter = new EventFilter(name);

// use then to setup listener for messages from sensors
  var then = function(cb) {
    process.on('message', function(m) {
      console.log('[M]->app'.blue, name, m);
      if (m.eventType === 'sensor-emit') {
        // console.log('applying filter:', filter.json());
        //FIXME: recast needed for apply, requires type attribute
        m = _.omit(m,'eventType');
        m.payload.type = m.sensor;
        cb(null, applyFilter(filter, m.payload));
      } else {
        cb('Invalid Message from Matrix' + m);
      }
    });
  }

  _.extend(filter, {
    then: then
  });

  return filter;
}
