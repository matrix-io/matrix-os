var DeviceDriver, VisionDriver, EyeDriver;

var debug = debugLog('detection');

module.exports = {
  commands: ['face', 'demographics'],
  // init runs automatically, wait for app to request component creation
  init: function () {
    VisionDriver = Matrix.service.protobuf.vision.vision;
    EyeDriver = Matrix.service.protobuf.malos.maloseye;
    DeviceDriver = Matrix.service.protobuf.malos.driver;
  },
  // not technically async, needs for facial_recognition
  read: function (buffer) {
    debug('read>', new VisionDriver.VisionResult.decode(buffer).toRaw());
    var detect = new VisionDriver.VisionResult.decode(buffer).toRaw();

    _.each(detect.vision_event, function (v) {
      debug('>v_e', v.tag, v.tracking_id);
      if (v.tag === 'TRACKING_START') {
        Matrix.service.track.add(v.tracking_id);
      } else if (v.tag === 'TRACKING_END') {
        Matrix.service.track.remove(v.tracking_id);
      }
    }
    );


    // unlike other sensors, this one is a collection
    return _.map(detect.rect_detection, (d) => {
      var o = {
        location: d.location,
        tag: d.tag,
        image: d.image,
        // image_small: d.image_small.toString()
      };

      if (_.has(d, 'tracking_id')) {
        o.trackId = parseInt(d.tracking_id, 10);
      }

      if (_.has(d, 'facial_recognition')) {
        o.demographics = _.reduce(d.facial_recognition, function (r, v, k) {
          // translate from { tag: 'EMOTION', emotion: 'HAPPY' to { emotion: 'happy' }
          var tag = v.tag.toLowerCase();
          if (_.has(v, tag)) {
            // simple values
            r[tag] = v[tag];
          } else {
            // complex values
            if (tag === 'head_pose') {
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
  prepare: function (options, cb) {
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
      options.refresh = options.refresh / 1000;
    }
    if (!_.has(options, 'timeout')) {
      options.timeout = 10.0;
    } else if (parseFloat(options.timeout) === options.timeout) {
      options.timeout = options.timeout / 1000;
    }

    // map options to protobuf config
    var driverConfig = new DeviceDriver.DriverConfig;
    // 2 seconds between updates.
    driverConfig.delay_between_updates = 0.05;
    // Stop sending updates 6 seconds after pings.
    // driverConfig.timeout_after_last_ping = options.timeout;

    var camConfig = new EyeDriver.CameraConfig;
    camConfig.camera_id = 0;
    camConfig.width = 640;
    camConfig.height = 480;

    driverConfig.malos_eye_config = new EyeDriver.MalosEyeConfig;
    driverConfig.malos_eye_config.camera_config = camConfig;

    debug('config>', driverConfig);
    cb(DeviceDriver.DriverConfig.encode(driverConfig).finish());
  },
  ping: function () {
    if (_.has(Matrix.components, 'detection')) {
      Matrix.components.detection.ping();
    } else {
      console.log('Detection available, not activated.');
    }
  },
  error: function (err) {
    console.error('Face', err);
  },

  config: function (options) {

    debug('config detection>', options);

    var config = new DeviceDriver.DriverConfig;
    config.malos_eye_config = new EyeDriver.MalosEyeConfig;

    // send config
    config.malos_eye_config.object_to_detect.push(EyeDriver.EnumMalosEyeDetectionType[options.enumName]);
    config.malos_eye_config.object_to_detect.push(EyeDriver.EnumMalosEyeDetectionType.FACE_DESCRIPTOR);

    if (_.has(Matrix.components, 'detection')) {
      Matrix.components.detection.config(config.encode(config).finish());
    } else {
      console.log('Detection Component not ready for Config');
    }

  }
};