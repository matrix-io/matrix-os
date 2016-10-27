var protoBuilder, protoVisionBuilder,matrixVisionMalosBuilder, matrixMalosBuilder;

var debug = debugLog('gesture')

module.exports = {
  // init runs automatically, wait for app to request component creation
  init: function(){
    protoVisionBuilder = Matrix.service.protobuf.vision.vision;
    // Parse matrix_malos package (namespace).
    matrixVisionMalosBuilder = protoVisionBuilder.build('admobilize_vision')

    protoBuilder = Matrix.service.protobuf.malos.driver;
    // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')

    MalosEyeConfigSocket.connect('tcp://' + creator_ip + ':' + creator_gesture_base_port /* config */)

    camera_config = new matrixMalosBuilder.CameraConfig
    camera_config.set_camera_id(0);
    camera_config.set_width(640);
    camera_config.set_height(480);

    console.log('configuring video capture')
    var config = new matrixMalosBuilder.DriverConfig
    // Generic configuration.
    // Almost 0 delay between updates. 50ms.
    config.set_delay_between_updates(0.005)
    // Driver specific configuration.
    config.malos_eye_config = new matrixMalosBuilder.MalosEyeConfig
    // Camera configuration.
    config.malos_eye_config.set_camera_config(camera_config)

    MalosEyeConfigSocket.send(config.encode().toBuffer())
  },
  read: function(buffer){
    debug('-detection>', new matrixVisionMalosBuilder.VisionResult.decode(buffer).toRaw() );
    var detect = new matrixVisionMalosBuilder.VisionResult.decode(buffer).toRaw();

    // unlike other sensors, this one is a collection
    return _.map(detect.rect_detection, (d) => {
      return {
        detection: d.tag,
        recognition: d.facial_recognition
      }
    });
  },
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

    // map options to protobuf config
    var driverConfigProto = new matrixMalosBuilder.DriverConfig
    // 2 seconds between updates.
    driverConfigProto.set_delay_between_updates(0.05);
    // Stop sending updates 6 seconds after pings.
    // driverConfigProto.timeout_after_last_ping = options.timeout;

    var camConfig = new matrixMalosBuilder.CameraConfig;
    camConfig.set_camera_id(0);
    camConfig.set_width(640);
    camConfig.set_height(480);

    driverConfigProto.malos_eye_config = new matrixMalosBuilder.MalosEyeConfig;
    driverConfigProto.malos_eye_config.set_camera_config(camConfig);

    debug('gesture start')
    cb(driverConfigProto.encode().toBuffer());
  },
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
  }
}
