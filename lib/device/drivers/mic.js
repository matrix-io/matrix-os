var DeviceDriver, IODriver;

// not using malos for data
var micInstance, micKill, micStream;

var debug = debugLog('mic');
var mic = require('mic');

module.exports = {
  init: function () {
    DeviceDriver = Matrix.service.protobuf.malos.driver;
    IODriver = Matrix.service.protobuf.malos.io;
  },
  read: function (spl) {
    debug('-read>', spl);

    return spl;
  },

  stop: function () {
    micInstance.stop();
  },

  prepare: function (options, cb) {

    //default to beamformed mic
    var micNum = (options.hasOwnProperty('number')) ? options.number : 8;

    if (!_.isNumber(micNum) || micNum < 0 || micNum > 8) {
      return cb(new Error('Bad Microphone Number:', micNum));
    }

    micInstance = mic({
      'bitwidth': 16,
      'device': 'mic_channel' + micNum,
      'rate': '16000',
      'channels': '1'
    });

    micStream = micInstance.getAudioStream();

    var headerSent = false;
    var ds = [];
    micStream.on('data', function (d) {

      if (!headerSent) {
        debug('id', d.slice(0, 4).toString());
        debug('format', d.slice(8, 12).toString());
        // debug('channels', d.readInt8(22));
        debug('rate', d.readInt16BE(24));
        debug('bits', d.readInt8(34));
        headerSent = true;
        return;
      }

      ds = [];
      var total = 0;

      for (var i = 0; i < d.byteLength / 2; i++) {
        ds.push(d.readInt16LE(i * 2));
      }
      // Root Mean Square for Energy
      var total = ds.reduce((a, b) => { return a + b; });
      var value = Math.abs(Math.round(total / ds.length / 128));
      // console.log(value, _.repeat('.', value))

      Matrix.events.emit('sensor-emit', { type: 'mic', value: value });

    });


    micInstance.start();

    var config = new IODriver.DriverConfig;

    if (!_.has(options, 'gain')) {
      options.gain = 0;
    }

    var micConfig = new IODriver.MicArrayParams;

    micConfig.gain = options.gain;
    // setup gain for all microphones
    micConfig.set_gain(8);

    // setup a sound source perpendicular to the MATRIX Creator
    micConfig.set_azimutal_angle(0);
    micConfig.set_polar_angle(0);
    micConfig.set_radial_distance_mm(1000);
    micConfig.set_sound_speed_mmseg(340.3 * 1000);

    config.set_micarray(micConfig);


    cb(DeviceDriver.DriverConfig.encode(config).finish());
  },

  ping: function () {

    if (_.has(Matrix.components, 'mic')) {

      Matrix.components.mic.ping();

      // mic isn't managed by malos, so we need to stop it here
      clearInterval(micKill);
      // if the above isn't called every 10 seconds, the process stops
      micKill = setTimeout(function () {
        micInstance.stop();
      }, 10000);

    } else {
      console.error('No Microphone Component Available for Ping');
      console.error('Components:', Matrix.components);
    }
  },
  error: function (err) {
    console.error('Mic', err);
  }
};