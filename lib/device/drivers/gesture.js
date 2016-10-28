var protoBuilder, protoVisionBuilder,matrixVisionMalosBuilder, matrixMalosBuilder;

var debug = debugLog('gesture')

module.exports = {
  commands: ['palm','thumb-up','fist','pinch'],
  // init runs automatically, wait for app to request component creation
  init: function(){
    protoVisionBuilder = Matrix.service.protobuf.vision.vision;
    // Parse matrix_malos package (namespace).
    matrixVisionMalosBuilder = protoVisionBuilder.build('admobilize_vision')

    protoBuilder = Matrix.service.protobuf.malos.driver;
    // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')
  },
  read: function(buffer){

    debug('-read>', new matrixVisionMalosBuilder.VisionResult.decode(buffer).toRaw() );
    var detect = new matrixVisionMalosBuilder.VisionResult.decode(buffer).toRaw();

    // unlike other sensors, this one is a collection
    return _.map(detect.rect_detection, (d) => {
      return {
        detection: d.tag,
        recognition: d.facial_recognition
      }
    });
  },


  // Prepare is done after init. To Prepare the connection by adding a configuration
  prepare: function(options, cb){
    if (_.isFunction(options)){
      cb = options;
      options = {};
    }
    if (_.isUndefined(options)){
      options = {};
    }

    if ( !_.has(options, 'refresh')){
      options.refresh = 1.0;
    } else if ( parseFloat(options.refresh) === options.refresh ){
      options.refresh = options.refresh / 1000
    }
    if ( !_.has(options, 'timeout')){
      options.timeout = 10.0;
    } else if ( parseFloat(options.timeout) === options.timeout ){
        options.timeout = options.timeout / 1000
    }

    var config = new matrixMalosBuilder.DriverConfig
    // Generic configuration.
    // Almost 0 delay between updates. 50ms.
    config.set_delay_between_updates(0.005)
    // Driver specific configuration.
    config.malos_eye_config = new matrixMalosBuilder.MalosEyeConfig


    var camConfig = new matrixMalosBuilder.CameraConfig;
    camConfig.set_camera_id(0);
    camConfig.set_width(640);
    camConfig.set_height(480);

    config.malos_eye_config = new matrixMalosBuilder.MalosEyeConfig;
    config.malos_eye_config.set_camera_config(camConfig);

    debug('gesture start')
    cb(config.encode().toBuffer());
  },

  // pings are executed by heartbeats
  ping: function(){
    if ( _.has(Matrix.components, 'gesture')){
      Matrix.components.gesture.ping();
    } else {
      console.error('No Gesture Component Available for Ping')
      console.error('Components:',Matrix.components);
    }
  },
  error: function(err){
    console.error('Face', err);
  },

  // gesture as enum PALM
  // TODO: support options, handle arrays
  config: function(gestures){

    debug('config>', gestures);

    var config = new matrixMalosBuilder.DriverConfig;
    config.malos_eye_config = new matrixMalosBuilder.MalosEyeConfig;
    // Generic configuration.
    // Almost 0 delay between updates. 50ms.
    config.set_delay_between_updates(0.005)
    // Driver specific configuration.
    //
    // var camConfig = new matrixMalosBuilder.CameraConfig;
    // camConfig.set_camera_id(0);
    // camConfig.set_width(640);
    // camConfig.set_height(480);
    //
    // config.malos_eye_config.set_camera_config(camConfig)

    // send config
    config.malos_eye_config.object_to_detect.push(matrixMalosBuilder.EnumMalosEyeDetectionType[gestures]);

    if ( _.has(Matrix.components, 'gesture')){
      Matrix.components.gesture.config( config.encode().toBuffer() );
    } else {
      console.error('No Gesture Component Available for Config')
      console.error('Components:', _.keys(Matrix.components).blue );
    }

  }
}
