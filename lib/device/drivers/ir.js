var protoBuilder, matrixMalosBuilder;

var debug = debugLog('ir');

module.exports = {
  /**
   * handle different commands from MOS
   * @param cmd.cmd = command  ex. 'BTN_POWER'
   * @param cmd.type = 'ir-cmd'
   */
  cmdHandler: function(cmd) {

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
    }

    var brand = options.brand.replace(/-./, '_').toLowerCase();
    var model = options.model.toUppercase() + '.lirc.conf';

    var url = ['http://assets.admobilize.com/lirc-remotes', brand, model].join('/');

    var irCmd = new matrixMalosBuilder.LircParams;
    require('http').get(url, function(res) {
      var status = res.statusCode;
      if (status !== 200) {
        console.error('Request Failed:', url, status);
      } else {
        var config = '';
        res.on('data', function(d) {
          config += d;
        })
        res.on('end', function() {
          var startI = config.indexOf('begin codes') + 11;
          var endI = config.indexOf('end codes');
          var codes = config.slice(startI, endI);
          codes = codes.split('\n').map(function(c) {
            // remove extra space
            return _.words(c);
          });

          console.log(config);


          irCmd.config = config;
        })
      }
    })

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