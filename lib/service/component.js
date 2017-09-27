/**
 * Component is a factory function for mapping ZeroMQ sockets to a standard interface.
 * This is used by drivers to interface with the hardware. The challenge here is
 * utilizing protobufs and 0mq in a standardized way where the drivers can use a
 * common format to expose different functionality to address the differences between
 * hardware components and mapping those to software requirements.
 *
 * @example Face detection creates a collection of recognition objects, detection.prepare
 * converts that to a single object format which is more easily parsed by humans.
 *
 * @param options { object } -
 * @param options.name - component name
 * @param options.send - 0MQ push socket for send
 * @param options.ping - 0MQ push socket for ping
 * @param options.read - 0MQ sub socket for read
 * @param options.error - 0MQ sub socket for error
 * @param options.config - 0MQ push socket for config, takes raw protobufs
 *
 * @var driver - references to the driver file at device/drivers
 *
 * @method send ( config, [cb] ) - protobuf and send a config object to 0MQ
 * @method print ( configProto ) - same as send, sending a raw protobuf buffer
 * @method ping () - sends a keepalive
 * @method read(cb) - start a listener waiting for a 0MQ message to Forward
 * @method read(cb) - start a listener waiting for a 0MQ error message
 * @method config(cb) - sends raw config protobuf to 0MQ
 *
 * @exports Matrix.components[options.name]
 *
 */

// Pass second option for override. ie. servo / gpio
module.exports = function (options, driver) {
  var self = this;

  //TODO: Make an env switch for this so we can dev new device drivers easily.
  self.debug = debugLog('Component]::' + options.name);
  self.name = options.name;

  // stores references to device/driver methods
  self.sockets = {
    send: options.send,
    read: options.read,
    ping: options.ping,
    error: options.error,
    config: options.config
  };

  if (_.isUndefined(options.read)) {
    self.sensor = false;
  } else {
    self.sensor = true;
  }

  if (_.isUndefined(driver)) {
    self.driver = Matrix.device.drivers[options.name];
  } else {
    self.driver = driver;
  }

  // send = send config to component. expects object.
  self.send = function (config, cb) {

    self.debug(']<-config', _.omit(config, 'send', 'config', 'error', 'ping'));

    // the driver turns it into a protobuf
    self.driver.prepare(config, function (configProto) {
      // proto -> zeromq
      self.debug(']<-configP', configProto);
      self.sockets.send.send(configProto);
      // continue, initialize sensor handler if necessary
      if (_.isFunction(cb)) {
        cb(configProto);
      }
    });
  };

  //for leds + loader right now, write protos direct to socket
  self.print = function (configProto) {
    // self.debug(']<-print', configProto);
    self.sockets.send.send(configProto);
  };

  // sends a keepalive on the channel
  self.ping = function () {
    self.debug(']<-ping');
    self.sockets.ping.send('');
  };

  self.read = function (cb) {
    self.debug('] read init');
    self.sockets.read.subscribe('');
    self.sockets.read.on('message', function (data) {
      data = self.driver.read(data);
      self.debug(']->', data);
      cb(data);
    });
  };

  // For async read processing - recog services
  self.readAsync = function (cb) {
    self.debug('] read async init');
    self.sockets.read.subscribe('');
    self.sockets.read.on('message', function (data) {
      self.driver.read(data, cb);
    });
  };

  self.error = function (cb) {
    self.debug('error init');
    self.sockets.error.subscribe('');
    self.sockets.error.on('message', function (data) {
      self.debug('->err'.red, data);
      if (_.has(self.driver, 'error')) {
        cb(self.driver.error(data));
      } else {
        cb(data);
      }
    });
  };

  // expects proto, unlike send
  // used for video services
  self.config = function (config, cb) {
    self.debug('config');
    self.sockets.config.send(config);
  };

  Matrix.components[self.name] = self;

  return self;
};