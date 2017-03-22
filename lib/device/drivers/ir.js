var protoBuilder, matrixMalosBuilder;

var debug = debugLog('ir');

module.exports = {
  /**
   * handle different commands from MOS
   * @param msg.cmd = command  ex. 'BTN_POWER'
   * @param msg.type = 'ir-cmd'
   * @param msg.payload = { model, brand }
   */
  cmdHandler: function(msg) {
    var cmd = msg.cmd;
    var p = msg.payload;
    var component;
    debug('device.ir.start>', msg);

    // have we made this yet?
    if (!Matrix.components.hasOwnProperty('ir')) {

      if (cmd === 'listen') {
        if (Matrix.activeSensors.indexOf('ir') === -1) {
          Matrix.activeSensors.push('ir');
        }

      }

      // fetches the zero mq connections in a keyed object { config, update, ping... }
      var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers.ir);

      // attach zmq to component record
      component = new Matrix.service.component(mqs);
    } else {
      component = Matrix.service.component.ir;
    }

    component.send(options.options, function() {
      // after sensor is configured, handle data events
      // c.sensor is determined by driver.read presence
      if (cmd === 'listen') {
        component.read(function(data) {

          debug('ir.read>', data);

          // for re-routing to apps on the other side of emit
          data.type = 'ir';

          // Forward back to the rest of the Application
          Matrix.events.emit('sensor-emit', data);

        })
      }
    });

    // routes back to prepare
    Matrix.components.ir.config();

  },
  init: function() {
    protoBuilder = Matrix.service.protobuf.malos.driver
      // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')
  },
  read: function(buffer) {
    console.log('ir read', buffer)
    return {
      value: new matrixMalosBuilder.LircParams.decode(buffer).pressure
    }
  },
  send: function(message) {
    var irCmd = new matrixMalosBuilder.LircParams;
    irCmd.device = 'SONY';
    irCmd.command = 'KEY_POWER';
    var config = new matrixMalosBuilder.DriverConfig;
    config.set_lirc(irCmd)

    Matrix.components.ir.print(config.encode().toBuffer());
  },
  prepare: function(options, cb) {
    if (_.isFunction(options)) {
      cb = options;
      options = {};
    }
    if (_.isUndefined(options)) {
      options = {};
    }

    if (!_.has(options, 'refresh')) {
      options.refresh = 1.0;
    } else if (parseFloat(options.refresh) === options.refresh) {
      options.refresh = options.refresh / 1000
    }
    if (!_.has(options, 'timeout')) {
      options.timeout = 15.0;
    } else if (parseFloat(options.timeout) === options.timeout) {
      options.timeout = options.timeout / 1000
    }

    if (!_.has(options, 'brand')) {
      return console.error('Brand Must Be Specified in IR Setup');
    } else if (!_.has(options, 'model')) {
      return console.error('Model must be specified in IR Setup')
    } else if (!_.has(options, 'config')) {
      return console.error('Configuration for device must be specified')
    }

    var irCmd = new matrixMalosBuilder.LircParams;

    irCmd.device = options.model;
    irCmd.command = options.cmd;
    irCmd.config = options.config;

    var malosCmd = new matrixMalosBuilder.DriverConfig;
    config.delay_between_updates = options.refresh;
    // Stop sending updates 6 seconds after pings.
    config.timeout_after_last_ping = options.timeout;
    malosCmd.set_lirc(irCmd)

    cb(config.encode().toBuffer());
  },
  ping: function() {
    if (_.has(Matrix.components, 'ir')) {
      Matrix.components.ir.ping();
    } else {
      console.error('No IR Component Available for Ping')
    }
  }
}