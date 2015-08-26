// NOTE: Required by each app, so these will be seperate. Shared resources and events are managed by the Matrix one layer up.
// see lib/services/manager

require('colors');

var config = require('./config.js');
var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;
var applyFilter = require('admobilize-eventfilter-sdk').apply;
var request = require('request');
var fs = require('fs');
var _ = require('lodash');
var DataStore = require('nedb');
var AppStore =  new DataStore({ filename: config.path.appStore, autoload: true });


var appName = '';


var storeManager = {
  get: getStore,
  set: setStore,
  delete: deleteStore,
  remove: deleteStore
}

function getStore(key){
  var q = {};
  q[key]= { $exists: true };
  AppStore.findOne(q, function(err, resp){
    if (err) cb(err);
    cb(null, resp);
  });
}

function setStore(){
  var obj = {};
  obj[key] = value;
  AppStore.insert(obj);
}

function deleteStore(key){
  var q = {};
  q[key]= { $exists: true };
  AppStore.remove(q, function(err, resp){
    if (err) cb(err);
    cb(null, resp);
  });
}



var assetPath = __dirname + '/../assets/'

var fileManager = {
    save: function(url, filename, cb){
      request.get(url, function(err, resp, body){
        if (err) console.error(err);
        fs.writeFileSync(assetPath + filename, body);
        cb(null, body);
      });
    },
    stream: function(){
      // are we doing this?
    },
    remove: function(filename, cb){
      fs.unlink(assetPath + filename, cb);
    },
    load: function(cb){
      //todo: handle async and sync
      fs.readFile(assetPath + filename, cb);
    },
    list: function(cb){
      fs.readdir(assetPath, function(err, files){
        if (err) console.error(err);
        cb(null, files);
      });
    }
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


module.exports = {
  name: function(name){
    appName = name;
  },
  audio: {
    say: function(msg){
      console.warn('')
    }
  },
  send: function(message) {
    process.send({
      type: 'sensor-emit',
      payload: message
    });
  },
  receive: receiveHandler,
  init: initSensor,
  file: fileManager,
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
