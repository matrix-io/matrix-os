var service = function(name, options) {
  // don't use context for self, will inherit from matrix
  var self = {};
  self.name = name;

  // find the service definition, by service name, engine or type
  var service = _.find(matrix.config.services, function(v, k) {
    // console.log(name, k, v)
    if (k === name || v.engine === name || v.type === name) {
      self.serviceName = k;
      return true;
    }
  });

  self.service = service;

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

  var voiceMethods = {
    /**
     * service().listen - has two forms
     * listen('string', function()) 
     * listen(function())
     * @param {(String|Function)} wake can be a service name, as defined in config.yaml or can be the callback
     * @param {Function} cb what to do after a wakeword is used
     */

    listen: function(wake, cb){
      
      if ( self.name === 'voice' && ( _.isUndefined(wake) || _.isFunction(wake) ) ){
        return console.error('No Service Name or Wakeword Defined for Voice Service');
      }

      // single param execution
      if ( !_.isString(wake)){
        cb = wake;
        // should be 'voice' or serviceName
        wake = self.name;
      }

      self.wakeword = wake;

      // if no wakeword or if it does not match defined wakeword
      if ( _.isUndefined(self.wakeword) || self.service.wakeword !== self.wakeword ){
        return console.error('Invalid or Undefined Wake Word', self.wakeword, 'looking for', self.service.wakeword)
      }

      if ( _.isUndefined(self.service.strictPhraseMatch) || self.service.strictPhraseMatch === true) {
        self.strictPhraseMatch = true;

        self.phrases = self.service.phrases;

        if ( _.isUndefined(self.phrases) || self.phrases.length === 0 ){
          return console.error('No Phrases defined in service configuration', service)
        }
      } else {
        self.strictPhraseMatch = false;
      }
      
      // no type here
      self.sendObj = _.omit(self.sendObj, 'serviceType');

      // customize command for voice
      _.extend(self.sendObj, {
        cmd: 'listen',
        payload: { wakeword: wake, phrases: self.phrases }
      });

      // send to MOS
      process.send(self.sendObj);

      if (_.isFunction(cb)){
        voiceMethods.then(cb);
      }
    },

    then: function(cb){
      var phraseRegex = self.strictPhraseMatch ? new RegExp(self.phrases.join('|'),'i') : new RegExp('.*?', 'i');
      process.on('message', function(data) {  
        console.log('VOICE SERVICE >> ', data, phraseRegex)
        if (data.eventType === 'service-emit' &&
          data.engine === self.engine &&
          // does the phrases for this service exist in detected speech
          !_.isNull( data.payload.speech.match(phraseRegex) )
        ) {
          if (_.isFunction(cb)) {
            cb(data.payload.speech.toLowerCase().replace( self.wakeword.toLowerCase(), '').trim());
          } else {
            console.log('No callback passed to service>%s.then', self.name);
          }
        }
      });
    }
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
      process.once('message', function(data) {

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
          cb(console.warn('No callback passed to service>%s.then', self.name));
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


  // this is what routes the next part of the chain
  // matrix.service.x
  // todo: service name lookup here
  if (name === 'recognition') {
    return _.omit(recognitionMethods, 'then');
  } else if (name === 'face' || name === 'demographics') {
    return _.omit(detectionMethods, 'then');
  } else if (name === 'vehicle') {
    return _.omit(vehicleMethods, 'then');
  } else if (name === 'voice') {
    return _.omit(voiceMethods, 'then');
  } else if (!_.isNull(name.match(/fist|thumb-up|palm|pinch/))) {
    return _.omit(gestureMethods, 'then');
  } else {
    console.error('Unrecognized Service Name', name);
  }



};
module.exports = service;