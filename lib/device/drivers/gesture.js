var protoBuilder, VisionDriver, DeviceDriver, MalosEye;

var debug = debugLog('gesture')

module.exports = {
  commands: ['palm', 'thumb-up', 'fist', 'pinch'],
  // init runs automatically, wait for app to request component creation
  init: function () {
    VisionDriver = Matrix.service.protobuf.vision;
    DeviceDriver = Matrix.service.protobuf.malos.driver;
    MalosEye = Matrix.service.protobuf.malos.maloseye;
    //Enums
  },
  // not technically async, but needs to be this way to support recog being under service
  read: function (buffer) {

    debug('-read>', VisionDriver.VisionResult.decode(buffer));
    var detect = VisionDriver.VisionResult.decode(buffer);

    // unlike other sensors, this one is a collection
    return _.map(detect.rectDetection, function (d) {
      return {
        location: d.location,
        tag: d.tag
      }
    })
  },


  // Prepare is done after init. To Prepare the connection by adding a configuration
  prepare: function (options, cb) {

    if (!_.has(options, 'enumName')) {
      return console.error('gesture>prepare has no enum name to specify algo')
    }

    if (!_.has(options, 'refresh')) {
      options.refresh = 1.0;
    } else if (parseFloat(options.refresh) === options.refresh) {
      options.refresh = options.refresh / 1000
    }
    if (!_.has(options, 'timeout')) {
      options.timeout = 10.0;
    } else if (parseFloat(options.timeout) === options.timeout) {
      options.timeout = options.timeout / 1000
    }

    var config = new DeviceDriver.DriverConfig;
    // Generic configuration.
    // Almost 0 delay between updates. 200ms.
    config.delayBetweenUpdates = 0.25;
    // Driver specific configuration.
    config.malosEyeConfig = new MalosEye.MalosEyeConfig;


    var camConfig = new MalosEye.CameraConfig;
    camConfig.cameraId = 0;
    camConfig.width = 640;
    camConfig.height = 480;

    config.malosEyeConfig = new MalosEye.MalosEyeConfig;
    config.malosEyeConfig.cameraConfig = camConfig;


    debug('gesture video setup for ', options.enumName)
    cb(DeviceDriver.DriverConfig.encode(config).finish());
  },

  // pings are executed by heartbeats
  ping: function () {
    if (_.has(Matrix.components, 'gesture')) {
      Matrix.components.gesture.ping();
    } else {
      console.error('No Gesture Component Available for Ping')
      console.error('Components:', Matrix.components);
    }
  },
  error: function (err) {
    console.error('Face', err);
  },

  // gesture as enum PALM
  // TODO: support options, handle arrays
  config: function (options) {

    debug('configure options>', options);

    var config = new DeviceDriver.DriverConfig;
    config.malosEyeConfig = new MalosEye.MalosEyeConfig;

    // send config = options.enumName = HAND_FIST, HAND_PALM, etc
    config.malosEyeConfig.objectToDetect.push(MalosEye.EnumMalosEyeDetectionType[options.enumName]);

    if (_.has(Matrix.components, 'gesture')) {
      Matrix.components.gesture.config(DeviceDriver.DriverConfig.encode(config).finish());
    } else {
      console.error('No Gesture Component Available for Config')
      console.error('Components:', _.keys(Matrix.components));
    }

  }
}