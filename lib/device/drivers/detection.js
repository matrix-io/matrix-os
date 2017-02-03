var protoBuilder, protoVisionBuilder,matrixVisionMalosBuilder, matrixMalosBuilder;

var debug = debugLog('detection')

module.exports = {
  commands: [ 'face', 'demographics' ],
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
    debug('read>', new matrixVisionMalosBuilder.VisionResult.decode(buffer).toRaw() );
    var detect = new matrixVisionMalosBuilder.VisionResult.decode(buffer).toRaw();

    // unlike other sensors, this one is a collection
    return _.map(detect.rect_detection, (d) => {
      var o = {
        location: d.location,
        tag: d.tag,
        image: d.imageg
      }
      if ( _.has(d, 'facial_recognition')){
        o.demographics = _.reduce(d.facial_recognition, function(r, v, k){
          // translate from { tag: 'EMOTION', emotion: 'HAPPY' to { emotion: 'happy' }
          var tag = v.tag.toLowerCase();
          if ( _.has(v, tag)){
            // simple values
            r[tag] = v[tag];
          } else {
            // complex values
            if ( tag === 'head_pose'){
              r.pose = {};
              r.pose.yaw = v.pose_yaw;
              r.pose.roll = v.pose_roll;
              r.pose.pitch = v.pose_pitch;
            }
          }
          return r;
        }, {});
      }
      return o;
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
    driverConfigProto.set_delay_between_updates(0.2);
    // Stop sending updates 6 seconds after pings.
    // driverConfigProto.timeout_after_last_ping = options.timeout;

    var camConfig = new matrixMalosBuilder.CameraConfig;
    camConfig.set_camera_id(0);
    camConfig.set_width(640);
    camConfig.set_height(480);

    driverConfigProto.malos_eye_config = new matrixMalosBuilder.MalosEyeConfig;
    driverConfigProto.malos_eye_config.set_camera_config(camConfig);

    console.log(driverConfigProto)
    debug('detection video setup for ', options.enumName)
    cb(driverConfigProto.encode().toBuffer());
  },
  ping: function(){
    if ( _.has(Matrix.components, 'detection')){
      Matrix.components.detection.ping();
    } else {
      console.error('No Detection Component Available for Ping')
      debug('Components:', _.keys(Matrix.components));
    }
  },
  error: function(err){
    console.error('Face', err);
  },

  config: function(detections){

    debug('config detection>', detections);

    var config = new matrixMalosBuilder.DriverConfig;
    config.malos_eye_config = new matrixMalosBuilder.MalosEyeConfig;

    // send config
    config.malos_eye_config.object_to_detect.push(matrixMalosBuilder.EnumMalosEyeDetectionType[detections]);

    if ( _.has(Matrix.components, 'detection')){
      Matrix.components.detection.config( config.encode().toBuffer() );
    } else {
      console.error('No Detection Component Available for Config')
      debug('Components:', _.keys(Matrix.components) );
    }

  }
}
