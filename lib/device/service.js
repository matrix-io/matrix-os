var debug = debugLog('device.service')

var gestureTypeList = [
  'palm', 'thumb-up', 'fist', 'pinch'
]

var detectionTypeList = [
  'face', 'demographics'
]

var recognitionTypeList = [
  'recognition'
]

var serviceMethods = {
  /**
   * Handles service-cmd events from apps
   * @param {} m
   * @param {} m.cmd - the command to run
   * @param {} m.engine - the engine to run 
   * @param {} m.serviceType - subset of engine to run
   * @param {} m.type - event name - should be 'service-cmd'
   * @param {} m.payload - data passed to message, usually options
   */
  cmdHandler: function(m) {
    if (m.type !== 'service-cmd') {
      return console.error('Service cmdHandler called with invalid event');
    }
    var cmd = m.cmd;
    var p = m.payload;
    var name = m.name;

    if (m.engine === 'recognition') {
      if (m.serviceType === 'face') {
        // only one for now

        if (cmd === 'delete') {
          Matrix.device.drivers.recognition.deleteTags(p);
        } else if (cmd === 'get-tags') {
          Matrix.device.drivers.recognition.getTags(function(err, tags) {
            if (err) return console.error(err);

            if (_.isEmpty(tags) || _.isUndefined(tags)) {
              debug('No Tags Found');
              return;
            }

            // Bypasses the normal route for returning info, which expects components and MALOS integration
            Matrix.events.emit('service-emit', {
              engine: 'recognition',
              type: 'face',
              enumName: 'FACE_RECOGNITION',
              serviceType: 'recognition-tags',
              payload: tags
            })
          });
        } else if (cmd === 'start') {
          serviceMethods.start({
            engine: 'recognition',
            serviceType: 'recognition-start',
            type: 'face',
          })
        }
      }
    }
  },

  // maps between matrix land and protocol buffer detection enums
  // TODO: fix this to be better. very brittle mapping between mos and malos

  getEnumName: function(engine, type) {
    var typePrefix = '',
      typeSuffix = '';

    if (engine === 'gesture') {
      typePrefix = 'HAND';
      if (gestureTypeList.indexOf(type) > -1) {
        typeSuffix += '_' + _.upperCase(type.replace('-', '_'));
      }
    }

    // TODO: refactor these
    if (engine === 'detection') {
      typePrefix = 'FACE';
      if (type === 'demographics') {
        typeSuffix = '_DEMOGRAPHICS';
      } else if (type === 'recognition') {
        typeSuffix = '_RECOGNITION';
      } else if (type === 'face') {} else {
        return console.error('Invalid engine:', engine)
      }
    }

    if (engine === 'recognition') {
      typeSuffix = 'RECOGNITION';
      if (type === 'face') {
        typePrefix = 'FACE_';
      }
    }
    return typePrefix + typeSuffix;
  },

  // used by heartbeat, which has access to enum name
  isGesture: function(enumName) {
    // debug('gesture?', enumName)
    if (enumName.split('_').length < 2) {
      return false;
    }
    return (gestureTypeList.indexOf(enumName.split('_')[1].toLowerCase().replace('_', '-')) > -1)
  },
  isDetection: function(enumName) {
    // debug('detection?', enumName)

    if (enumName === 'FACE') {
      return true;
    }

    if (enumName.split('_').length < 2) {
      return false;
    }

    return (detectionTypeList.indexOf(
      enumName.split('_')[1]
      .toLowerCase()
      .replace('_', '-')
    ) > -1)
  },

  isRecognition: function(enumName) {
    return (enumName.indexOf('RECOGNITION') > -1)
  },

  /**
   // this is kicked off from app.init -> service-init event
   **/
  /**
   * Starts service as component. Used with ZMQ + MALOS integrations.
   * @param {} options
   * @param {} options.name - = engine and driver
   * @param {} options.type - subset of engine
   * @param {} options.serviceType - used to route inside to application
   * 
   */
  start: function(options) {

    debug('start>', options);

    var allTypes = gestureTypeList.concat(detectionTypeList, recognitionTypeList);

    if (allTypes.indexOf(options.name) === -1) {
      debug(allTypes)
      return warn('No Matching Service Found', options.name)
    }

    if (Matrix.activeServices.indexOf(options.name) !== -1) {
      debug(Matrix.activeServices)
        // return error('Duplicate Service Initialization', options.name)
    }

    Matrix.activeServices.push(options.name);
    Matrix.activeServices = _.uniq(Matrix.activeServices);

    var driver = options.service.engine;

    // fetches the zero mq connections in a keyed object { config, update, ping... }
    var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers[driver]);

    var enumName = Matrix.device.service.getEnumName(driver, options.name);

    // put connections in options for component - swap options name and type
    _.assign(options, mqs, {
      name: driver,
      type: options.service.type,
      enumName: enumName
    });

    // construct with component Class
    var component = new Matrix.service.component(options);

    // initial configuration
    component.send(options, function() {
      debug('component config send>', driver, options.type)

      // secondary setup - cv config
      Matrix.device.drivers[driver].config(options);

      if (component.hasOwnProperty('read')) {

        debug('component read setup')

        // setup read handler
        component.readAsync(function(serviceOutput) {

          // TODO: Add tracking code!

          debug(options.name + ')C read>', serviceOutput);

          // standardize to array for emitting back into event
          if (!_.isArray(serviceOutput)) {
            serviceOutput = [serviceOutput];
          }

          _.each(serviceOutput, (d) => {

            // for re-routing to apps on the other side of emit
            d.engine = driver;
            d.type = options.type;
            d.enumName = enumName;

            // only recog uses this atm
            if (options.hasOwnProperty('serviceType')) {
              d.serviceType = options.serviceType;
            }

            // Forward back to the rest of the Application
            Matrix.events.emit('service-emit', d);

          })

        })
      }
    });

    component.error(function(data) {
      console.error('SERVICE ERROR', data);
    })
  }
}

module.exports = serviceMethods;