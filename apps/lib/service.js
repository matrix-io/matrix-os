var service = function(name, options) {
  var self = this;
  self.name = name;
  self.options = options;
  console.log('matrix.service::', name, options);
  return {
    stop: function() {
      process.send({ type: 'service-cmd', cmd: 'stop', name: name, options: options });
    },
    // recog functions
    untrain: function(tags) {
      if (_.isString(tags)) {
        tags = [tags];
      } else if (_.isArray(tags)) {
        // delete is a more computational friendly cmd name then untrain
        process.send({ type: 'service-cmd', cmd: 'delete', name: name, options: options });
      }
    },
    train: function(options) {
      if (!_.isUndefined(options)) {
        self.options = options;
      }
      process.send({ type: 'service-cmd', cmd: 'train', name: name, options: options });
    },
    start: function(options) {
      if (!_.isUndefined(options)) {
        self.options = options;
      }
      process.send({ type: 'service-cmd', cmd: 'start', name: name, options: options });
    },
    then: function(cb) {
      process.on('message', function(data) {
        if (data.eventType === 'service-emit') {
          cb(data.payload);
        }
      })
    }
  }

  module.exports = service;
}