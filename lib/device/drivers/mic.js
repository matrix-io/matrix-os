var protoBuilder, matrixMalosBuilder;

// not using malos for data
var micInstance, lastSampleAvg, micStream;

var debug = debugLog('mic');
var mic = require('mic')

module.exports = {
  init: function(){
    protoBuilder = Matrix.service.protobuf.malos.driver;
    matrixMalosBuilder = protoBuilder.build('matrix_malos');
  },
  read: function(spl){
    debug('-read>', spl);

    return spl;
  },

  prepare: function(options, cb){

    //default to beamformed mic
    var micNum = (options.hasOwnProperty('number') ) ? options.number : 0;

    micInstance = mic({
      'bitwidth': 16,
      'device':'mic_channel' + micNum,
      'rate': '8000',
      'channels': '1'
    });

    micStream = micInstance.getAudioStream();

    micStream.on('data', function(d){
      var sound = Float32Array.from(d);
      var total = sound.reduce((a,b)=>{ return a+b });
      lastSampleAvg = total / sound.length;
      // lastSampleAvg = sound[0];

      console.log(_.repeat('.', lastSampleAvg / 8 ));
      // patch in because mic doesn't use malos
      Matrix.events.emit('sensor-emit', { type: 'mic', value: lastSampleAvg });

    })

    micInstance.start();




      var config = new matrixMalosBuilder.DriverConfig;

      if ( !_.has(options, 'gain' )) {
        options.gain = 0;
      }

      var micConfig = new matrixMalosBuilder.MicArrayParams;

      micConfig.gain = options.gain;
      // setup gain for all microphones
      micConfig.set_gain(8)

      // setup a sound source perpendicular to the MATRIX Creator
      micConfig.set_azimutal_angle(0)
      micConfig.set_polar_angle(0)
      micConfig.set_radial_distance_mm(1000)
      micConfig.set_sound_speed_mmseg(340.3 * 1000)

      config.set_micarray(micConfig);

      cb( config.encode().toBuffer() );
    },

    ping: function(){
      if ( _.has(Matrix.components, 'mic')){
        Matrix.components.mic.ping();
      } else {
        console.error('No Microphone Component Available for Ping')
        console.error('Components:',Matrix.components);
      }
    },
    error: function(err){
      console.error('Mic', err)
    }
  }
