// NOTE: Required by each app, so these will be seperate. Shared resources and events are managed by the Matrix one layer up.
// see lib/services/manager

require('colors');
//needs sudo for audio commands disable until we figure this out
// var loudness = require('loudness');
var player = require('player');
var microphone = require('node-record-lpcm16');
var request = require('request');
var config = require('./config.js');
var lib = require('./lib');
var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;
var applyFilter = require('admobilize-eventfilter-sdk').apply;
var request = require('request');
var fs = require('fs');
var _ = require('lodash');
var DataStore = require('nedb');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var AppStore = new DataStore({ filename: config.path.appStore, autoload: true });

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

  if ( name === 'camera' ){
    // pop into OpenCv
    // var eyes = new OpenCv({cameraId:'test'});
    //
    // eyes.setConfiguration(options, function(err, a){
    //
    //   //test
    //   var file = require('fs').readFileSync('/Users/god/Desktop/holly.jpg');
    //   eyes.analyzeImage(file, function(err, d){
    //     console.log('Image', err, d);
    //   });
    //   console.log('setConfig', err, a)
    //   eyes.startCamera(0, function(err, b){
    //     console.log('startCamera', err, b);
    //     eyes.startContinuousDetection( function(err, c){
    //       console.log('detect', err, c);
    //     });
    //   });
    // });
  }
  // kick off sensor readers
  process.send({
    type: 'sensor-init',
    name: name,
    options: options
  });

  var filter = new EventFilter(name);

  // then is a listener for messages from sensors
  // FIXME: Issue with app only storing one process at a time
  // console.log('sensor err >> looking into fix');
  var then = function(cb) {
    process.on('message', function(m) {
      console.log('[M]->app'.blue, name, m);
      if (m.eventType === 'sensor-emit') {

        console.log(m);

        var result;
        // console.log('applying filter:', filter.json());

        //TODO: when sensors fail to deliver, fail here gracefully
        m = _.omit(m,'eventType');
        m.payload.type = m.sensor;

        // if there is no filter, don't apply
        if (filter.filters.length > 0){
          result = applyFilter(filter, m.payload);
        } else {
          result = m.payload;
        }

        if (result !== false && !_.isUndefined(result)){
          cb(null, result);
        }

      } else {
        cb('Invalid Message from Matrix' + JSON.stringify(m));
      }
    });
  };

  _.extend(filter, {
    then: then
  });

  return filter;
}

function sendConfig(){
  process.send({
    type: 'app-config',
    payload: Matrix.appConfig
  });
}

var Matrix = {
  name: function(name){ appName = name; },
<<<<<<< HEAD
  cv: function(camera, appOptions) {
    if(camera === undefined || camera === null) {
      camera = 'localCamera';
    }

    var cv = new opencv({ "cameraId" : camera });
    var options = {
      'height': 640,
      'width':  480,
      'minSize':  20, //50,
<<<<<<< HEAD
      'maxSize': 400,//-1,
      'drawObjects': false,
=======
      'maxSize': 400, //-1,
      'drawObjects': false, 
>>>>>>> app updates for matrix
      'processAge': false, //should be minimized to "age"
      'processGender': true, // should be "gender"
      'processEmotion': true, // should be "emotion"
      'processDwell':true, // should be "dwell"
      'show': false, // "show should = preview"
      'save': false, // should be "store", or "save"
      'debug': true,
      'processUniques': true, //should be just "uniques"
      'frameRate': 5,  //number of frames per second
      'device': 0, //this seems like duplicate code, could be normalized
      'bufferImage': null,
      'detection': { // should just be part of configuration (e.g. face), see above
        type: "humans",
        detector: 3
      },
      "directory": __dirname + "/../../opencv-node-sdk/admobilize-detection-manager/admobilize-detection/data"

      //should have a default path that works, seems to never work with default path
    };
    if(options === undefined || options === null) {
      // do nothing
    } else {
      options.processAge = appOptions.age || false;
      options.processGender = appOptions.gender || false;
      options.processEmotion = appOptions.emotion || false;
      options.processDwell = appOptions.dwell || false;
      if(appOptions.type === 'face') {
        options.detection = { type: 'humans', detector: 3 };
      }
    }

    cv.setConfiguration(options,function(){
      console.log('setting configuration');
      cv.startCamera(0, function(error){
        console.log('starting camera', error);
        if(!error) {
          console.log('starting continuous detection');
          cv.startContinuousDetection();
        }else{
          error("error", error);
        }
      });
    });

    return cv;
  },
=======
>>>>>>> updates to lib refactor for matrix.js
  _: _,
  cv: lib.cv,
  request: request,
  audio: {
    say: function(msg){
      console.warn('say() is not implemented yet')
    },
    play: function(file, volume){
      var assetPath = __dirname + '/' + appName + '.matrix/storage/';
      var volume = ( !_.isUndefined(volume)) ? volume: 80;
      require('loudness').setVolume( volume, function(){});
      var soundPlayer = new player( assetPath + file );
      soundPlayer.play( function(err, played){
        if (err) console.error(err);
        console.log('played');
      });
      return soundPlayer;
    }
  },
  mic: microphone,
  send: function(message) {
    //console.log('[M]('+ appName +') ->', message);
    if (!message.hasOwnProperty('data')){
      message = { data: message };
    }

    message.data.time = Date.now();

    if(this.hasOwnProperty('dataType')) {
      var type = this.dataType;
      message.type = type;
    }

    process.send({
      type: 'app-emit',
      payload: message
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
    try {
      Matrix.appConfig = JSON.parse( require('fs').readFileSync(__dirname + '/'+ name +'.matrix/config.json'));
    } catch(e){
      return console.error(appName, 'invalid config.json');
    }

    Matrix.config = Matrix.appConfig.configuration;

    // TODO: Make sure something can request app-config
    if ( !Matrix.hasOwnProperty('appConfig')){
      console.error('No Configuration Specified')
    }
    // sending config on socket open
    process.on('message', function(m){
      if (m.type === 'request-config'){
        sendConfig();
      }
    })
    //send config on app start
    sendConfig();

    return Matrix;
  },
  store: storeManager,
  debug: matrixDebug,
  notify: interAppNotification,
  on: interAppResponse
}

module.exports = Matrix;
