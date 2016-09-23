// Components are a utility constructor for device level 0mq ports and methods


module.exports = function(options){
  var self = this;

  //TODO: Make an env switch for this so we can dev new device drivers easily.
  self.debug = debugLog('Component]::' + options.name);
  self.name = options.name;

  self.debug(options.name, options.options);
  // stores references to device/driver methods
  self.sockets = {
    send: options.send,
    read: options.read,
    ping: options.ping,
    error: options.error
  };

  if ( _.isUndefined( options.read )){
    self.sensor = false;
  } else {
    self.sensor = true;
  }

  self.driver = Matrix.device.drivers[options.name];

  // send = send config to component. expects object.
  self.send = function( config, cb ){
    self.debug(']<-config', config);
    // the driver turns it into a protobuf
    self.driver.prepare(config, function(configProto){
      // proto -> zeromq
      self.debug(']<-configP', configProto )
      self.sockets.send.send(configProto);
      // continue, initialize sensor handler if necessary
      if ( _.isFunction(cb)){
        cb(configProto);
      }
    })
  }

  //for leds + loader right now, write protos direct to socket
  self.print = function(configProto){
    self.debug(']<-print', configProto);
    self.sockets.send.send(configProto)
  }

  // sends a keepalive on the channel
  self.ping = function(){
    self.debug(']<-ping')
    self.sockets.ping.send('');
  }


  self.read = function(cb){
    self.debug('] update init');
    self.sockets.read.subscribe('');
    self.sockets.read.on('message', function(data){
      data = self.driver.read(data)
      self.debug(']->', data);
      cb(data);
    });

    // temp until heartbeat is done
    self.ping();
  }

  self.error = function(cb){
    self.debug('error init');
    self.sockets.error.subscribe('');
    self.sockets.error.on('message', function(data){
      self.debug('->err'.red, data);
      cb(data);
    });
  }

  Matrix.components[self.name] = self;

  return self;
}
