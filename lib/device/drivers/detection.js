var DeviceDriver, VisionDriver, EyeDriver, VisionService;

var debug = debugLog('detection');

module.exports = {
  commands: ['face', 'demographics'],
  // init runs automatically, wait for app to request component creation
  init: function () {
    VisionDriver = Matrix.service.protobuf.vision;
    VisionService = Matrix.service.protobuf.vision_service;
    EyeDriver = Matrix.service.protobuf.malos.maloseye;
    DeviceDriver = Matrix.service.protobuf.malos.driver;

    //enums
    EventTags = Matrix.service.protobuf.vision.EventTag;
  },
  // not technically async, needs for facialRecognition
  read: function (buffer) {
    var detect = VisionDriver.VisionResult.decode(buffer);
    debug('read>', detect);

    _.each(detect.vision_event, function (v) {
      debug('>v_e', _.findKey(EventTags, v.tag), v.trackingId);
      if (v.tag === EventTags['TRACKING_START']) {
        Matrix.service.track.add(v.trackingId);
      } else if (v.tag === EventTags['TRACKING_END']) {
        Matrix.service.track.remove(v.trackingId);
      }
    }
    );


    // unlike other sensors, this one is a collection
    return _.map(detect.rectDetection, (d) => {
      var o = {
        location: d.location,
        tag: d.tag,
        image: d.image,
        // image_small: d.image_small.toString()
      };

      if (_.has(d, 'trackingId')) {
        o.trackId = parseInt(d.trackingId, 10);
      }

      if (_.has(d, 'facialRecognition')) {
        o.demographics = _.reduce(d.facialRecognition, function (r, v, k) {
          // translate from { tag: 'EMOTION', emotion: 'HAPPY' to { emotion: 'happy' }
          var tag = v.tag.toLowerCase();
          if (_.has(v, tag)) {
            // simple values
            r[tag] = v[tag];
          } else {
            // complex values
            if (tag === 'head_pose') {
              r.pose = {};
              r.pose.yaw = v.poseYaw;
              r.pose.roll = v.poseRoll;
              r.pose.pitch = v.posePitch;
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
    driverConfig.delayBetweenUpdates = 0.05;
    // Stop sending updates 6 seconds after pings.
    // driverConfig.timeoutAfterLastPing = options.timeout;

    var camConfig = new EyeDriver.CameraConfig;
    camConfig.cameraId = 0;
    camConfig.width = 640;
    camConfig.height = 480;

    driverConfig.malosEyeConfig = new EyeDriver.MalosEyeConfig;
    driverConfig.malosEyeConfig.cameraConfig = camConfig;

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
    config.malosEyeConfig = new EyeDriver.MalosEyeConfig;

    // send config
    config.malosEyeConfig.objectToDetect.push(EyeDriver.EnumMalosEyeDetectionType[options.enumName]);
    config.malosEyeConfig.objectToDetect.push(EyeDriver.EnumMalosEyeDetectionType.FACE_DESCRIPTOR);

    if (_.has(Matrix.components, 'detection')) {
      Matrix.components.detection.config(DeviceDriver.DriverConfig.encode(config).finish());
    } else {
      console.log('Detection Component not ready for Config');
    }

  }
};