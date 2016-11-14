var protoBuilder, matrixMalosBuilder;

var debug = debugLog('mic');

module.exports = {
  init: function(){
    protoBuilder = Matrix.service.protobuf.malos.driver;
    matrixMalosBuilder = protoBuilder.build('matrix_malos');
  },
  read: function(buffer){
    var s = new matrixMalosBuilder.MicArrayParams.decode(buffer).toRaw();
    debug('-read>', s);

    return {
      azimuth: ( s.azimutal_angle + (Math.PI/2) ) * 57.2957,
      polar: ( s.polar_angle + (Math.PI/2) ) * 57.2957,
      distance: s.radial_distance_mm,
      speed: s.sound_speed_mmseg
    }
  },

  prepare: function(options, cb){
    var config = new matrixMalosBuilder.DriverConfig;

    if ( !_.has(options, 'gain' )) {
      options.gain = 0;
    }

    var micConfig = new matrixMalosBuilder.MicArrayParams;

    micConfig.gain = options.gain;

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
