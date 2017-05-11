// NOTE: Required by each app, so these will be seperate. Shared resources and events are managed by the Matrix one layer up.
// see lib/services/manager



// Globals
require('colors');
_ = require('lodash');

//needs sudo for audio commands disable until we figure this out
var request = require('request');
var lib = require('./lib');

var fs = require('fs');
var DataStore = require('nedb');
var AppStore = new DataStore('application.db');

process.setMaxListeners(50);

error = function() {
  console.error('[(%s)]⁊', appName);
  console.error.apply(null, arguments);
};

var appName = '';

var storeManager = {
  get: getStore,
  set: setStore,
  delete: deleteStore
};

function getStore(key, cb) {
  var q = {};
  q[key] = { $exists: true };
  AppStore.findOne(q, function(err, resp) {
    if (err) cb(err);
    cb(null, resp);
  });
}

function setStore(key, value, cb) {
  var obj = {};
  obj[key] = value;
  AppStore.insert(obj, cb);
}

function deleteStore(key, cb) {
  var q = {};
  q[key] = { $exists: true };
  AppStore.remove(q, function(err, resp) {
    if (err) cb(err);
    cb(null, resp);
  });
}


var fileManager = {
  save: function(url, filename, cb) {
    var assetPath = __dirname + '/' + appName + '.matrix/storage/';
    request.get(url, function(err, resp, body) {
      if (err) error(err);
      try {
        fs.accessSync(assetPath);
      } catch (e) {
        fs.mkdirSync(assetPath);
      }
      fs.writeFileSync(assetPath + filename, body);
      cb(null, body);
    });
  },
  stream: function() {
    // are we doing this? yes, for streaming media
  },
  remove: function(filename, cb) {
    var assetPath = __dirname + '/' + appName + '.matrix/storage/';
    fs.unlink(assetPath + filename, cb);
  },
  load: function(filename, cb) {
    var assetPath = __dirname + '/' + appName + '.matrix/storage/';
    //todo: handle async and sync based on usage
    fs.readFile(assetPath + filename, cb);
  },
  list: function(cb) {
    var assetPath = __dirname + '/' + appName + '.matrix/storage/';
    fs.readdir(assetPath, function(err, files) {
      if (err) error(err);
      cb(null, files);
    });
  }
};

var matrixDebug = false;

// For sending events to other apps
function interAppNotification(appName, eventName, p) {
  var payload = p;
  var type;
  var event;

  if (arguments.length === 1) {
    // global form
    type = 'app-message';
    payload = arguments[0];
  } else if (arguments.length === 2) {
    //app specific
    type = 'app-' + appName + '-message';
    payload = arguments[1];
  } else {
    // app specific event namespaced
    type = 'app-' + appName + '-message';
    event = eventName;
  }

  var sendObj = {
    type: type,
    payload: payload
  };

  if (!_.isUndefined(event)) {
    _.extend(sendObj, { event: event });
  }

  process.send(sendObj);
}

// For recieving events from other Apps
function interAppResponse(name, cb) {
  if (_.isUndefined(cb)) {
    // for globals
    cb = name;
  }
  console.log('setup event listeners:', name);

  process.on('message', function(m) {
      // is global or app-specific
    if (m.type === 'trigger' || m.type === 'app-message' || m.type === 'app-' + appName + '-message') {
      console.log('[M]->app(msg)'.blue, m);
      if (_.isString(name)) {
        // if an event name was specified in the on()
        if (m.eventName == name) {
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


function sendConfig(config) {
  process.send({
    type: 'app-config',
    payload: config || Matrix.config
  });
}

function doTrigger(group, payload) {

  // assume if no group, hit all of same group
  process.send({
    type: 'trigger',
    group: group,
    payload: payload
  });
}

var Matrix = {
  appName: appName,
  name: function(name) { appName = name; return appName; },
  _: _,
  camera: lib.cv,
  request: request,
  led: require('./lib/led'),
  audio: {
    say: function(msg) {
      console.log('say() is not implemented yet');
    },
    play: function(file, volume) {
      console.log('play() is not implemented yet');
    }
  },
  send: function(message) {
    require('./lib/send.js').apply(Matrix, [message]);
  },
  type: function(type) {
    //set type, return this
    this.dataType = type;
    return this;
  },
  receive: receiveHandler,
  init: require('./lib/init.js'),
  gpio: require('./lib/gpio.js'),
  servo: require('./lib/gpio.js').servo,
  file: fileManager,
  emit: interAppNotification,
  startApp: function(name, config) {


    // If forked, send is available.
    // Docker means no .send. Lets make a send to forward to stdout
    // Stupid thing will also trigger on tests, lets not do that
    if (!_.isFunction(process.send) && !process.env.hasOwnProperty('TEST_MODE')) {
      // Need to override log for Docker compatibility.
      console.log = function() {
        var o = {
          type: 'log',
          payload: _.map(arguments, (a) => {
            return (_.isPlainObject(a)) ? JSON.stringify(a) : a;
          }).join(' ')
        };
        process.stdout.write(JSON.stringify(o) + '\n');
      };
      console.log('Docker Detected');
      process.send = function(obj) {
        var send;
        try {
          send = JSON.stringify(obj);
        } catch (e) {
          console.error('App Data Error', e, obj);
        } finally {
          process.stdout.write(`${send}\n`);
        }
      };
        // if forked, stdin is piped to message events
        // Docker needs override
      process.stdin.on('readable', function() {
        const msg = process.stdin.read();
        // multiple msgs might be sent in one event
        if (!_.isNull(msg)) {
          var msgs = _.compact(msg.toString().split('\n'));
          var msgObjs = [];
          try {
            // parse each one independently! - woot working
            msgObjs = msgs.map((m) => { return JSON.parse(m); });
          } catch (e) {
            console.error('App Data In Error:', e, msgs);
          } finally {
            // emit one event for each msg found
            if (msgObjs.length > 0) {
              msgObjs.forEach((m) => {
                process.emit('message', m);
              });
            }
          }
        }
      });
    }
    console.log('Matrix OS Application Library Loading...');


    appName = name;

    // Config is written as JSON by MOS -
    try {
      if (_.isUndefined(config)) {
        Matrix.config = JSON.parse(require('fs').readFileSync(__dirname + '/' + name + '.matrix/config.json'));
      } else {
        // for testing
        Matrix.config = config;
      }
    } catch (e) {
      return error(appName, 'invalid config.json', e);
    }

    if (Matrix.config.name !== appName) {
      return console.error(appName + '.matrix is not the same as config name:', Matrix.config.name);
    }

    // make configuration available globally `Matrix.services.vehicle.engine`
    _.each(_.keys(Matrix.config.settings), function(k) {
      Matrix[k] = Matrix.config.settings[k];
    });


    // console.log('setup generic listener');
    // generic message handlers
    process.on('message', function(m) {
      if (_.isString(m)) {
        m = JSON.stringify(m.toString());
      }
      if (m.type === 'request-config') {
        sendConfig();
      } else if (m.type === 'container-status') {
        Matrix.pid = m.pid;
      } else if (m.type === 'container-ready') {
        console.log('Matrix App Host Ready!');
      } else if (m.type === 'app-error'){
        // Made an error on the MOS side which requires quitting application
        console.error('Application Host Error', m.message, '\nQuitting....');
      }
    });

    return Matrix;
  },
  store: storeManager,
  debug: matrixDebug,
  notify: interAppNotification,
  on: interAppResponse,
  trigger: doTrigger,
  color: require('tinycolor2'),
  static: function() {
    console.log('static not implmented uyet');
  },

  zigbee: function() {
    if (Matrix.config.integrations.indexOf('zigbee') === -1) {
      return console.error('Zigbee is not configured for this application. Please add `zigbee` to config>integrations');
    }
    return require('./lib/zigbee.js');
  },
  static: function() {
    console.log('static not implmented yet');
  },
  service: require('./lib/service.js'),
  sensor: require('./lib/sensor.js')
};

module.exports = Matrix;