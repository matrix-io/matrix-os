// NOTE: Required by each app, so these will be seperate. Shared resources and events are managed by the Matrix one layer up.
// see lib/services/manager

require('colors');

var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;
var applyFilter = require('admobilize-eventfilter-sdk').apply;
var _ = require('lodash');

var appName = '';

module.exports = {
  name: function(name){
    appName = name;
  },
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
  },
  debug: matrixDebug,
  notify: interAppNotification,
  on: interAppResponse
}

var matrixDebug = false;

// For listening to events from other apps
function interAppNotification( appName, eventName, payload ){
  if (arguments.length === 1){
    // global form
    process.send({
      type: 'app-message',
      payload: arguments[0]
    });
  } else if ( arguments.length === 2){
    //app specific
    process.send({
      type: 'app-'+appName+'-message',
      payload: arguments[1]
    })
  } else {
    // app specific event namespaced
    process.send({
      type: 'app-'+appName+'-message',
      event: eventName,
      payload: payload
    })
  }
}

// For Sending Messages to other Apps
function interAppResponse( name, cb ){
  if (_.isUndefined(cb)){
    // for globals
    cb = name;
  }

  process.on('message', function(m){
      // console.log('[M]->app'.blue, m, 'app-'+appName+'-message')
      // is global or app-specific
    if (m.type === "app-message" || m.type === 'app-'+appName+'-message'){
      // console.log('[M]->app(msg)'.blue, m)
      if ( _.isString(name) ){
        // if an event name was specified in the on()
        if ( m.event == name ){
          cb(m);
        }
        // no event name match, no fire listener
      } else {
        cb(m);
      }

    }

  });
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
  console.log('Initialize Sensor:'.blue , name);

  process.send({
    type: 'sensor-init',
    name: name,
    options: options
  });

  var filter = new EventFilter(name);

  // then is a listener for messages from sensors
  var then = function(cb) {
    process.on('message', function(m) {
      console.log('[M]->app'.blue, name, m);
      if (m.eventType === 'sensor-emit') {
        // console.log('applying filter:', filter.json());
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
