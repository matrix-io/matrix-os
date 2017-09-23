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

let DeviceDriver, IODriver;

const debug = debugLog('wakeword');

module.exports = {
  init: () => {
    DeviceDriver = Matrix.service.protobuf.malos.driver;
    IODriver = Matrix.service.protobuf.malos.io;
  },
  read: (buffer) => {

  },
  /**
   * @param options.channel - which microphone
   * @param options.wakeword - set wakeword, defaults to MATRIX
   */
  prepare: (options, cb) => {
    debug('prepare', options);
    if (!_.has(options, 'wakeword') ||
      !_.isString(options.wakeword) || options.wakeword.length > 0
    ) {
      return console.error('No Wakeword provided.')
    }

    let wakeword_config = new IOBuilder.WakeWordParams;
    wakeword_config.wakeWord(options.wakeword);
    wakeword_config.lmPath("/home/pi/assets/9854.lm");
    wakeword_config.dicPath("/home/pi/assets/9854.dic");

    if (_.has(options, 'channel')) {
      if (
        _.isInteger(options.channel) &&
        options.channel <= 8 &&
        options.channel >= 0
      ) {
        let channel = IOBuilder.WakeWordParams.MicChannel['channel' + options.channel];
        wakeword_config.channel(channel);
      } else {
        return console.error('Invalid Channel ( 0-8 )', options.channel);
      }
    } else {
      wakeword_config.channel(IOBuilder.WakeWordParams.MicChannel.channel0)
    }
    wakeword_config.enableVerbose = false;
    cb(IOBuilder.WakeWordParams.encode(wakeword_config).finish());
  },
  stop: () => {
    let wakeword_config = new IOBuilder.WakeWordParams;
    wakeword_config.stopRecognition = true;
    Matrix.components.wakeword.config(IOBuilder.WakeWordParams.encode(wakeword_config).finish());
  }
}