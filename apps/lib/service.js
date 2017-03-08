var service = function(name, options) {
  // don't use context for self
  var self = {};
  self.name = name;

  console.log(matrix.config)
    // find the service definition
  var service = _.map(matrix.config.services, function(v, k) {
    console.log(v, k)
    if (v.engine === name || k === name) {
      return { type: v.type, engine: v.engine }
    }
  })[0];

  if (_.isUndefined(service)) {
    console.log('invalid service declared. No configuration available for ', name);
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
  }

  var recognitionMethods = {
    // no chain methods
    stop: function() {
      _.assign(self.sendObj, {
        cmd: 'stop'
      })
      process.send(self.sendObj);
    },
    untrain: function(tags) {
      if (_.isString(tags)) {
        tags = [tags];
      }

      if (_.isArray(tags)) {
        console.log('Untrain: ', tags)
          // delete is a more computational friendly cmd name then untrain
        _.assign(self.sendObj, {
          cmd: 'delete',
          options: tags
        })
        process.send(self.sendObj);
      } else {
        console.error('Recognition.untrain requires a string or array ->', tags);
      }
    },

    // chain methods
    getTags: function(cb) {
      _.assign(self.sendObj, {
        cmd: 'get-tags'
      })
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
        self.options = options
      }
      _.assign(self.sendObj, {
        cmd: 'start',
        payload: self.options
      })
      process.send(self.sendObj);
      self.activeSubserviceType = 'recognition-recognize';
      // support multiple declarations, callback or promises
      if (_.isFunction(cb)) { recognitionMethods.then(cb); }
      return _.pick(recognitionMethods, 'then', 'stop');
    },

    //chain to
    then: function(cb) {
      process.on('message', function(data) {
        // console.log('RECOG SERVICE THEN', data)
        if (data.eventType === 'service-emit' && data.serviceType === self.activeSubserviceType) {

          cb(_.omit(data.payload, 'serviceType', 'engine', 'type'));
        }
      })
    }
  }

  if (name === 'recognition') {
    return _.omit(recognitionMethods, 'then');
  } else {
    console.error('Unrecognized Service Name', name);
  }

}
module.exports = service;