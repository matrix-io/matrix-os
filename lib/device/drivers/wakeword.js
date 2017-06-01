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
let protoBuilder, matrixMalosBuilder;

const debug = debugLog('wakeword');

module.exports = {
  init: () => {
    protoBuilder = Matrix.service.protobuf.malos.driver;
    matrixMalosBuilder = protoBuilder.build('matrix_malos');
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

    let wakeword_config = new matrixMalosBuilder.WakeWordParams;
    wakeword_config.set_wake_word(options.wakeword);
    wakeword_config.set_lm_path("/home/pi/assets/9854.lm");
    wakeword_config.set_dic_path("/home/pi/assets/9854.dic");

    if (_.has(options, 'channel')) {
      if (
        _.isInteger(options.channel) &&
        options.channel <= 8 &&
        options.channel >= 0
      ) {
        let channel = matrixMalosBuilder.WakeWordParams.MicChannel['channel' + options.channel];
        wakeword_config.set_channel(channel);
      } else {
        return console.error('Invalid Channel ( 0-8 )', options.channel);
      }
    } else {
      wakeword_config.set_channel(matrixMalosBuilder.WakeWordParams.MicChannel.channel0)
    }
    wakeword_config.set_enable_verbose(false)
    cb(wakeword_config.encode().toBuffer());
  },
  stop: () => {
    let wakeword_config = new matrixMalosBuilder.WakeWordParams;
    wakeword_config.set_stop_recognition(true)
    Matrix.components.wakeword.config(wakeword_config.encode().toBuffer());
  }
}