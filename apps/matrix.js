// NOTE: Required by each app, so these will be seperate. Shared resources and events are managed by the Matrix one layer up.
// see lib/services/manager

console.log('Matrix OS Application Library Loading...')

require('colors');
//needs sudo for audio commands disable until we figure this out
// var loudness = require('loudness');
// var player = require('player');
var microphone = require('node-record-lpcm16');
var request = require('request');
var lib = require('./lib');
var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;
var applyFilter = require('admobilize-eventfilter-sdk').apply;
var request = require('request');
var fs = require('fs');
var _ = require('lodash');
var DataStore = require('nedb');
var events = require('events');
var eventEmitter = new events.EventEmitter();

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

function setStore(key, value){
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


var fileManager = {
    save: function(url, filename, cb){
      var assetPath = __dirname + '/' + appName + '.matrix/storage/';
      request.get(url, function(err, resp, body){
        if (err) console.error(err);
        try {
          fs.accessSync(assetPath)
        } catch (e) {
          fs.mkdirSync(assetPath);
        }
        fs.writeFileSync(assetPath + filename, body);
        cb(null, body);
      });
    },
    stream: function(){
      // are we doing this? yes, for streaming media
    },
    remove: function(filename, cb){
    var assetPath = __dirname + '/' + appName + '.matrix/storage/';
    fs.unlink(assetPath + filename, cb);
  },
  load: function(cb){
    var assetPath = __dirname + '/' + appName + '.matrix/storage/';
    //todo: handle async and sync based on usage
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
    // debug('[M]->app'.blue, m, 'app-'+appName+'-message')
    // is global or app-specific
  if (m.type === 'trigger' || m.type === "app-message" || m.type === 'app-'+appName+'-message'){
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

function setupCVHandlers(cb){
process.on('message', function(m){
  if(m.type=== 'cv-data'){

  }
})
}


function initSensor(name, options, cb) {
console.log('Initialize Sensor:'.blue , name);

var filter;

//TODO: Figure out how to dynamically add CV algo values here
if ( name === 'face' ){
  process.send({type:'ves-init', payload: name});
} else {

  var sensors = [];
  // kick off sensor readers
  if ( _.isArray(name)) {
    sensors.concat(name)
  } else {
    sensors.push(name);
  }

  var returnObj = function(){
    console.warn(this, ' is a multi typed Matrix data object, please specify a child data souce using key-value notation ( obj.sensor or obj[\'sensor\'])')
    return {};
  };

  // handle many sensors
  _.forEach(sensors, function (s) {

    // break down options by key if necessary
    if ( options.hasOwnProperty(s) ){
      var sensorOptions = options.s;
    } else {
      sensorOptions = options;
    }

    // kick off sensor init
    process.send({
      type: 'sensor-init',
      name: s,
      options: sensorOptions
    });
  });
}
// # sensor || CV

  // prepare local chaining filter
  var filter = new EventFilter(name);

  // then is a listener for messages from sensors
  // FIXME: Issue with app only storing one process at a time
  // console.log('sensor err >> looking into fix');
  var then = function(cb) {

    var result;
    // recieves from events/sensors
    process.on('message', function(m) {

      if (m.eventType === 'sensor-emit') {
        // TODO: filter multiple sensors
        if ( m.sensor === s ){

          //TODO: when sensors fail to deliver, fail here gracefully
          m = _.omit(m,'eventType');
          m.payload.type = m.sensor;

          // console.log('sensor:', m.sensor, '-> app'.blue, name, m);
          // if there is no filter, don't apply
          if (filter.filters.length > 0){
            result = applyFilter(filter, m.payload);
          } else {
            result = m.payload;
          }

          if (result !== false && !_.isUndefined(result)){
            // LORE: switched from err first to promise style
            // provides .then(function(data){})
            cb(result);
          }
        }
        // console.log('applying filter:', filter.json());


      }

      if (m.eventType === 'cv-data'){
        _.omit( m, 'eventType' );

        // Do filter
        //TODO: Switch out format for unified object
        if (filter.filters.length > 0){
          result = applyFilter(filter, m.payload);
        } else {
          result = m.payload;
        }

        if (result !== false && !_.isUndefined(result)){
          // LORE: switched from err first to promise style
          // provides .then(function(data){})
          cb(result);
        }
      }

    });
  }


  _.extend(filter, {
    then: then
  });

  if ( _.isArray(name)){

    //overload function with error message above throwing if no key specified
    returnObj[s] = filter;
  } else {
    // singles
    returnObj = filter;
  }


  return returnObj;
}

function sendConfig(config){
  process.send({
    type: 'app-config',
    payload: config || Matrix.config
  });
}

function doTrigger(group, payload){

  // assume if no group, hit all of same group
  process.send({
    type:'trigger',
    group: group,
    payload:payload
  })
}

var Matrix = {
  name: function(name){ appName = name; },
  _: _,
  camera: lib.cv,
  request: request,
  audio: {
    say: function(msg){
      console.warn('say() is not implemented yet')
    },
    play: function(file, volume){
      console.warn('play() is not implemented yet' )
      // var assetPath = __dirname + '/' + appName + '.matrix/storage/';
      // var volume = ( !_.isUndefined(volume)) ? volume: 80;
      // require('loudness').setVolume( volume, function(){});
      // var soundPlayer = new player( assetPath + file );
      // soundPlayer.play( function(err, played){
      //   if (err) console.error(err);
      //   console.log('played');
      // });
      // return soundPlayer;
    }
  },
  mic: microphone,
  send: function(message) {
    // console.log('[M]('+ appName +') send ->', message);
    if ( _.isNull(message) ){
      return console.error('null message from matrix.send')
    }
    // if (!message.hasOwnProperty('data')){
    //   message = { data: message };
    // }

    var type, msgObj = {};
    if( this.hasOwnProperty('dataType') ) {
      type = this.dataType;
    } else {
      return console.error('No TYPE specified in matrix.send. Use matrix.type().send()')
    }
    //TODO: Ensure type conforms to config.dataTypes

    if ( !Matrix.config.dataTypes.hasOwnProperty(type)){
      console.log(type, 'not found in config datatypes');
    } else {
      // support non-typed array declarations
      if ( !_.isArray(dataTypes) ){
        var format = Matrix.config.dataTypes[type];
        if ( (format === 'string' && _.isString(message)) ||
        ( format === 'float' && _.isFloat(message) )      ||
        ( format === 'int' && _.isInteger(message) ) ){
          msgObj.value = message;
        } else if ( format === 'object' && _.isPlainObject(message)  ){
          msgObj = message;
        } else {
          console.log('Type', type, 'data not correctly formatted.')
          console.log('Expecting:', format);
          console.log('Recieved:', message);
        }
      }
    }

    msgObj.time = Date.now();
    msgObj.type = type;
    process.send({
        type: 'app-emit',
        payload: msgObj
    });
  },
  type: function(type) {
    //set type, return this
    this.dataType = type;
    return this;
  },
  receive: receiveHandler,
  init: initSensor,
  file: fileManager,
  emit: function(type, msg){
    process.send({
      type: type,
      payload: msg
    })
  },
  startApp: function(name){
    appName = name;
    var yaml = require('js-yaml');
    var fs = require('fs');


    // TODO: Provide process with newest configuration via File and ENVS. Liberal Restarts

    // WIP
    try {
      Matrix.config = JSON.parse( require('fs').readFileSync(__dirname + '/'+ name +'.matrix/config.json'));
    } catch(e){
      return console.error(appName, 'invalid config.yaml', e);
    }

    // make configuration available globally `Matrix.services.vehicle.engine`
    _.each( _.keys(Matrix.config), function(k){
        Matrix[k] = Matrix.config[k];
    })

    // sending config on socket open
    process.on('message', function(m){
      if (m.type === 'request-config'){
        sendConfig();
      } else if ( m.type === 'container-status'){
        Matrix.pid = m.pid;
      }
    })
    //TODO: Remove in favor of Firebase
    //send config on app start
    // sendConfig(Matrix.config);

    return Matrix;
  },
  store: storeManager,
  debug: matrixDebug,
  notify: interAppNotification,
  on: interAppResponse,
  trigger: doTrigger
}

module.exports = Matrix;
