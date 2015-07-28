require('colors');

var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;
var applyFilter = require('admobilize-eventfilter-sdk').apply;
var _ = require('lodash');

module.exports = {
  send: function(message) {
    process.send({
      type: 'data-point',
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

  var then = function(cb) {
    process.on('message', function(m) {
      if (m.eventType === 'sensor-event') {
        // console.log('app:[M]->app t:sensor-event'.blue, name, m);
        // console.log('applying filter:', filter.json());
        //FIXME: recast needed for apply, requires type attribute
        m = _.omit(m,'eventType');
        cb(null, applyFilter(filter, m));
      } else {
        cb(new Error('Invalid Message from Matrix', m));
      }
    });
  }

  _.extend(filter, {
    then: then
  });

  return filter;
}
