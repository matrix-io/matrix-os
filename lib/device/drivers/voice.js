/*  // Wake Word
  string wake_word = 1;

  // Mic channel
  enum MicChannel {
    channel0 = 0;
    channel1 = 1;
    channel2 = 2;
    channel3 = 3;
    channel4 = 4;
    channel5 = 5;
    channel6 = 6;
    channel7 = 7;
    channel8 = 8;
  }

  MicChannel channel = 2;

  // lenguaje model path from lmtool or similar alternative:
  // http://www.speech.cs.cmu.edu/tools/lmtool-new.html
  string lm_path = 3;

  // dictionary path from lmtool
  string dic_path = 4;

  // enable pocketsphinx verbose mode
  bool enable_verbose = 5;

  // stop recognition service
  bool stop_recognition = 6;
*/

let IODriver, DeviceDriver;

const debug = debugLog('voice');

module.exports = {
  init: () => {
    IODriver = Matrix.service.protobuf.malos.io;
    DeviceDriver = Matrix.service.protobuf.malos.driver;
  },

  // translate from wakeWord to speech
  read: (buffer) => {
    var d = IODriver.WakeWordParams.decode(buffer);
    debug('read.decode> ', d);
    return {
      speech: (_.isUndefined(d.speech)) ? d.wakeWord : d.speech
    }
  },
  /**
   * @param options.channel - which microphone
   * @param options.wakeword - set wakeword, defaults to MATRIX
   */
  prepare: (options, cb) => {
    debug('prepare', options);
    // FIXME: bad structure. easier to patch here then in component
    var vc = options.options;
    if (!_.has(vc, 'wakeword') ||
      !_.isString(vc.wakeword) || vc.wakeword.length === 0
    ) {
      console.log(!_.has(vc, 'wakeword'),
        !_.isString(vc.wakeword), vc.wakeword.length)
      return console.error('No Wakeword provided.')
    }

    let config = IODriver.WakeWordParams.create({
      wakeWord: vc.wakeword.toUpperCase(),
      lmPath: "/home/pi/assets/9854.lm",
      dicPath: "/home/pi/assets/9854.dic",
      // TODO: change the channel
      channel: IODriver.WakeWordParams.MicChannel.channel8,
      enableVerbose: false
    });
    

    // if (_.has(vc, 'channel')) {
    //   if (
    //     _.isInteger(vc.channel) &&
    //     vc.channel <= 8 &&
    //     vc.channel >= 0
    //   ) {
    //     let channel = IODriver.WakeWordParams.MicChannel['channel' + vc.channel];
    //     config.channel = channel;
    //   } else {
    //     return console.error('Invalid Channel ( 0-8 )', vc.channel);
    //   }
    // } else {
    //   config.channel = IODriver.WakeWordParams.MicChannel.channel0;
    // }
    // config.enableVerbose = false;
    debug('prepare >', config);
    var DeviceConfig = new DeviceDriver.DriverConfig;
    DeviceConfig.wakeword = config;
    cb(DeviceDriver.DriverConfig.encode(DeviceConfig).finish());
  },
  stop: () => {
    let wakeword_config = new IODriver.WakeWordParams;
    wakeword_config.stopRecognition = true;
    Matrix.components.wakeword.config(IODriver.WakeWordParams.encode(wakeword_config).finish());
  },
  error: (err) => {
    console.error(err)
  },
  config: (options) => {
    debug('Voice doesn\'t need a config step');
  }
}