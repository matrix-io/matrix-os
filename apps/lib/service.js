var service = function(name, options) {
  // don't use context for self
  var self = {};
  self.name = name;

  // find the service definition
  var service = _.find(matrix.config.services, function(v, k) {
    // console.log(name, k, v)
    if (k === name || v.engine === name || v.type === name) {
      return true;
    }
  });

  console.log('service>', service);

  if (_.isUndefined(service)) {
    return console.error('invalid service declared. No configuration available for ', name);
  }

  self.engine = service.engine;
  self.type = service.type;

  console.log('matrix.service::', self.name, ':', self.engine, '>', self.type);

  // to filter returning messages appropriately
  self.activeSubserviceType = '';

  self.sendObj = {
    type: 'service-cmd',
    engine: self.engine,
    serviceType: self.type
  };

  var recognitionMethods = {
    // no chain methods
    stop: function() {
      _.assign(self.sendObj, {
        cmd: 'stop'
      });
      process.send(self.sendObj);
    },
    untrain: function(tags) {
      if (_.isString(tags)) {
        tags = [tags];
      }

      if (_.isArray(tags)) {
        console.log('Untrain: ', tags);
          // delete is a more computational friendly cmd name then untrain
        _.assign(self.sendObj, {
          cmd: 'delete',
          options: tags
        });
        process.send(self.sendObj);
      } else {
        console.error('Recognition.untrain requires a string or array ->', tags);
      }
    },

    // chain methods
    getTags: function(cb) {
      _.assign(self.sendObj, {
        cmd: 'get-tags'
      });
      process.send(self.sendObj);
      self.activeSubserviceType = 'recognition-tags';
      // support multiple declarations, callback or promises
      if (_.isFunction(cb)) { recognitionMethods.then(cb); }
      return _.pick(recognitionMethods, 'then');
    },

    // stoppables
    train: function(tags, cb) {
      if (_.isString(tags)) {
        tags = [tags];
      }

      if (_.isArray(tags)) {
        _.assign(self.sendObj, {
          cmd: 'train',
          payload: tags
        });
        
        process.send(self.sendObj);
        self.activeSubserviceType = 'recognition-train';
        // support multiple declarations, callback or promises
        if (_.isFunction(cb)) { recognitionMethods.then(cb); }
        return _.pick(recognitionMethods, 'then', 'stop');
      } else {
        console.error('Recognition.train requires a string or array ->', tags);
      }
    },

    start: function(options, cb) {
      if (!_.isUndefined(options)) {
        self.options = options;
      }
      _.assign(self.sendObj, {
        cmd: 'start',
        payload: self.options
      });
      process.send(self.sendObj);
      self.activeSubserviceType = 'recognition-recognize';
      // support multiple declarations, callback or promises
      if (_.isFunction(cb)) { recognitionMethods.then(cb); }
      return _.pick(recognitionMethods, 'then', 'stop');
    },


    then: function(cb) {
      console.log('setup service listener');
      process.on('message', function(data) {

        // console.log('RECOG SERVICE THEN', data)
        if (data.eventType === 'service-emit' &&
          data.type === self.type &&
          data.engine === self.engine &&
          data.serviceType === self.activeSubserviceType) {
          if (_.isFunction(cb)) {
            cb(_.omit(data.payload, 'serviceType', 'engine', 'type'));
          } else {
            console.log('No callback passed to service>%s.then', self.name);
          }
        }
      });
    }
  };


  /** 
   * MOS sending back to the application
   * @param data.eventType - lands it on service handler
   * @param data.payload - what to return to the application
   * @param data.engine - what engine it ran
   * @param data.type - what type of subengine
   * @param data.serviceType - what subclass within the type
   */
  self.thenFn = function(cb) {

    console.log('setup service listener');
    process.on('message', function(data) {

      console.log('APP>SERVICE>', data);
      if (data.eventType === 'service-emit' &&
        data.type === self.type &&
        data.engine === self.engine) {
        if (_.isFunction(cb)) {
          cb(_.omit(data.payload, 'serviceType', 'engine', 'type'));
        } else {
          console.log('No callback passed to service>%s.then', self.name);
        }
      }
    });
  };


  self.stopFn = function() {
    _.assign(self.sendObj, {
      cmd: 'stop',
    });
    process.send(self.sendObj);
  };


  var detectionMethods = {
    start: function(options, cb) {
      if (!_.isUndefined(options)) {
        self.options = options;
      }
      _.assign(self.sendObj, {
        cmd: 'start',
        payload: self.options
      });
      process.send(self.sendObj);
      // support multiple declarations, callback or promises
      if (_.isFunction(cb)) { detectionMethods.then(cb); }
      return _.pick(detectionMethods, 'then', 'stop');
    },
    stop: self.stopFn,
    then: self.thenFn
  };

  var vehicleMethods = {
    start: function(options, cb) {
      if (!_.isUndefined(options)) {
        self.options = options;
      }
      _.assign(self.sendObj, {
        cmd: 'start',
        payload: self.options
      });
      process.send(self.sendObj);
      // support multiple declarations, callback or promises
      if (_.isFunction(cb)) { vehicleMethods.then(cb); }
      return _.pick(vehicleMethods, 'then', 'stop');
    },
    stop: self.stopFn,
    then: self.thenFn
  };

  var gestureMethods = {
    start: function(options, cb) {
      if (!_.isUndefined(options)) {
        self.options = options;
      }
      _.assign(self.sendObj, {
        cmd: 'start',
        payload: self.options
      });
      process.send(self.sendObj);
      // support multiple declarations, callback or promises
      if (_.isFunction(cb)) { gestureMethods.then(cb); }
      return _.pick(gestureMethods, 'then', 'stop');
    },
    stop: self.stopFn,
    then: self.thenFn
  };

  if (name === 'recognition') {
    return _.omit(recognitionMethods, 'then');
  } else if (name === 'face' || name === 'demographics') {
    return _.omit(detectionMethods, 'then');
  } else if (name === 'vehicle') {
    return _.omit(vehicleMethods, 'then');
  } else if (!_.isNull(name.match(/fist|thumb-up|palm|pinch/))) {
    return _.omit(gestureMethods, 'then');
  } else {
    console.error('Unrecognized Service Name', name);
  }



};
module.exports = service;