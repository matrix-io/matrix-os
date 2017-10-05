// Unlike other drivers, this will use RPC directly

var VisionDriver, DeviceDriver, RecognitionRPC, RecognitionDriver, RecognitionService,
  RecognitionService,
  protoVisionBuilder,
  protoMalosBuilder;

var debug = debugLog('recognition');

var grpc = require('grpc');


var trainingTags = [];
var recognizeTags = [];

var N_DESCRIPTORS = 3;
var RECOG_SERVICE_DEV = 'dev-recognize.matrix.one:50051';
var RECOG_SERVICE_PROD = 'recognize.matrix.one:443';
var RECOG_SERVICE_RC = 'rc-recognize.matrix.one:443';

var HOST_ADDRESS;

var headers;


var mode = 0;
var modes = ['OFF', 'TRAIN', 'RECOGNIZE'];

function getAllTags(cb) {
  startRecognitionService();

  RecognitionService.getFeatureDescriptorTags({}, headers, function (err, res) {
    if (err) return cb(err);
    if (res.hasOwnProperty('featureTagsForDevice')) {
      var tagData = res.featureTagsForDevice;
      var tags = [];
      tags = _.map(tagData, function (t) {
        return _.map(t.tags, function (tag) {
          return tag;
        });
      });
      tags = _.uniq(tags);
      tags = _.flattenDeep(tags);

      cb(null, tags);
    } else {
      debug('no tags to fetch');
      cb(null, []);
    }
  });
}

function startRecognitionService() {
  if (_.isUndefined(RecognitionRPC)) {
    module.exports.init();
  }

  headers = new grpc.Metadata();
  headers.add('authorization', 'Bearer ' + Matrix.deviceToken);

  var credentials = grpc.credentials.createSsl();

  if (_.isUndefined(RecognitionService)) {
    RecognitionService = RecognitionRPC.create(function rpcImpl() {
      console.log('>>>', arguments)
    })
    // RecognitionService = RecognitionRPC(
    //   HOST_ADDRESS, credentials
    // );
    debug('RecognitionService:'.blue, HOST_ADDRESS, credentials);
  }


  return RecognitionService;
}

function deleteTags(tags, cb) {
  debug('delete>', tags);
  if (_.isUndefined(tags)) {
    return console.error('No Tags passed to Recognition>DeleteTags');
  }
  startRecognitionService();

  RecognitionService.deleteFeatureDescriptors({ tags: tags }, headers, function deletedTags(err, resp) {
    if (err) console.error(err);
    console.log('deleted>', resp);
    if (_.isFunction(cb)) cb();
  });
}

/**
 * Obtain a list of descriptors
 * @param  {[]}   uuids options.uuids for descriptors
 * @param  {[]}   tags  options.tags for descriptors, ignored when uuid is provided
 * @param  {Function} cb
 */
function getDescriptors(options, cb) {
  if (!_.isUndefined(options.uuids) && !_.isUndefined(options.tags)) {
    console.warn('UUID will take precedence over tags');
  }
  var done = false;
  var descriptors = [];

  //TODO: Evaluate adding device_id to options
  async.doWhilst(
    function (cb) {
      RecognitionService.getFeatureDescriptors(options, headers, (err, resp) => {
        if (err) cb(err);
        descriptors.concat(resp.featureDescriptorList);
        if (_.isUndefined(resp.nextPageToken)) {
          done = true;
        } else {
          options.nextPageToken = resp.nextPageToken;
        }
        cb(null, descriptors);
      });
    },
    function () { return !done; },
    function (err, descriptors) {
      if (err) cb(err);
      cb(null, descriptors);
    }
  );
}

module.exports = {
  commands: ['recognition'],
  init: function () {
    VisionDriver = Matrix.service.protobuf.vision.vision;

    RecognitionRPC = Matrix.service.grpc.recognition;

    EyeDriver = Matrix.service.protobuf.malos.maloseye;
    RecognitionService = Matrix.service.protobuf.vision.recognition_service;
    RecognitionDriver = Matrix.service.protobuf.vision.recognition;
    DeviceDriver = Matrix.service.protobuf.malos.driver;



    var env = process.env.NODE_ENV;

    if (env === 'dev') {
      HOST_ADDRESS = RECOG_SERVICE_DEV;
    } else {
      HOST_ADDRESS = RECOG_SERVICE_PROD;
    }


  },

  getTags: getAllTags,

  // configure malos first
  prepare: function (component, cb) {
    if (_.isUndefined(VisionDriver)) {
      module.exports.init();
    }
    var options = component.options;
    var config = new DeviceDriver.DriverConfig;
    config.delayBetweenUpdates = 0.05;
    config.timeoutAfterLastPing = 15;
    config.malosEyeConfig = new EyeDriver.MalosEyeConfig;
    var cameraConfig = new EyeDriver.CameraConfig;
    //reference
    config.malosEyeConfig.cameraConfig = cameraConfig;

    cameraConfig.cameraId = 0;
    cameraConfig.width = 800;
    cameraConfig.height = 600;


    cb(DeviceDriver.DriverConfig.encode(config).finish());

    // parse mode option
    if (options.hasOwnProperty('mode')) {
      var m = modes.indexOf(options.mode.toUpperCase());
      if (m !== -1) {
        mode = m;
      } else { console.warn('Invalid Recognition Mode:', options.mode); }
    } else if (options.train && options.recognize === true) {
      // parse train and recognize options
      console.warn('Cannot set both train and recognize to true.');
      console.warn('Defaulting to recognize');
      mode = modes.indexOf('RECOGNIZE');
    } else if (options.train === true) {
      mode = modes.indexOf('TRAIN');
    } else if (options.recognize === true) {
      mode = modes.indexOf('RECOGNIZE');
    } else {
      console.warn('No mode specified, defaulting to recognize');
      mode = modes.indexOf('RECOGNIZE');
    }


    // parse tag and tags

    var targetTags = [];
    // make sure tags is ok
    if (_.has(options.tags) && !_.isArray(options.tags)) {
      if (!_.isString(options.tags)) {
        console.warn('Unparsable tags passed to recognition:', options.tags);
      }
      options.tags = options.tags.split(',');
    }
    if (_.has(options, 'tag') && _.isString(options.tag)) {
      targetTags = [options.tag];
    }
    if (_.has(options, 'tags') && _.isArray(options.tags)) {
      targetTags = options.tags;
    }
    if (_.has(options, 'tag') && _.has(options, 'tags')) {
      targetTags = options.tags.push(options.tag);
    }

    // reconcile mode with tags
    if (mode === modes.indexOf('TRAIN')) {
      trainingTags = targetTags;
    } else if (mode === modes.indexOf('RECOGNIZE')) {
      recognizeTags = targetTags;
    }

    // config is called next - startDetection

  },

  // happens after preparation
  config: function (options) {

    startRecognitionService();

    // setup malos_eye_
    var config = new DeviceDriver.DriverConfig;
    config.malosEyeConfig = new EyeDriver.MalosEyeConfig;
    // FIXME: We should only need FACE_DESCRIPTOR here. @resolved?
    config.malosEyeConfig.when.push(
      DeviceDriver.EnumMalosEyeDetectionType.FACE_DEMOGRAPHICS);
    config.malosEyeConfig.when.push(
      DeviceDriver.EnumMalosEyeDetectionType.FACE_DESCRIPTOR);


    cb(DeviceDriver.DriverConfig.encode(config).finish());

    // Additional Inits
    getAllTags(function (err, tags) {
      if (err) console.error(err);
      console.log('Saved Tags:'.yellow, tags);
      // uncomment to clear training on service start
      // if (!_.isEmpty(tags)) deleteTags(tags);
    });
  },

  delete: deleteTags,


  deleteAll: function () {
    getAllTags(function (tags) {
      RecognitionService.deleteFeatureDescriptors({
        tags: tags
      }, headers, (err, res) => {
        if (err) console.error(err);
        if (res) debug(res);
      });
    });
  },

  read: function (buffer, cb) {
    // debug('read>', buffer);
    if (_.isUndefined(buffer) || mode === 0) { return; }
    var result = new VisionDriver.VisionResult.decode(buffer);

    // debug('>read', result)

    if (result.vision_event.length > 0) {
      _.each(result.vision_event, function (v) {
        debug('>v_e', v.tag, v.trackingId);
        if (v.tag === 'TRACKING_START') {
          Matrix.service.track.add(v.trackingId);
        } else if (v.tag === 'TRACKING_END') {
          Matrix.service.track.remove(v.trackingId);
        }
      });
    }

    _.each(result.rect_detection, function (r) {
      if (!Matrix.service.track.has(r.trackingId)) {
        console.warn('Detection has no Tracking Id', r, Matrix.service.track.getIds());
      }

      var tId = r.trackingId.toString();
      debug('track id>', tId);

      _.each(r.facialRecognition, function (recog) {

        if (recog.tag === 'FACE_DESCRIPTOR') {

          if (mode === modes.indexOf('TRAIN')) {

            var trainTarget = 7;

            Matrix.service.track.addDescriptor(tId, recog.face_descriptor);
            var dCount = Matrix.service.track.getDescriptors(tId).length;
            console.log('Trained: ', dCount);

            if (dCount >= trainTarget) {

              debug('>face_recog', recog.tag, tId);

              var descriptors = _.map(Matrix.service.track.getDescriptors(tId), function (d) {
                var feature = new RecognitionRPC.FeatureDescriptor();
                feature.tags = trainingTags;
                feature.data = d;
                return feature;
              });

              Matrix.service.track.clearDescriptors(tId);

              debug('Send to RS Training > ', descriptors, trainingTags);
              RecognitionService.storeFeatureDescriptors({
                'tags': trainingTags,
                'feature_descriptors': descriptors,
              }, headers, function (err, res) {
                if (err) return error(err);
                debug('train >', res);
                // Send results back to app
                cb({ uuids: Array.from(res), done: true });
              });
            } else {
              // send back count info for progress
              cb({ count: dCount, target: trainTarget, done: false });
            }
            // end training

          } else if (mode === modes.indexOf('RECOGNIZE')) {

            debug('recog', recog);
            var features = [];
            var featureList = new RecognitionRPC.FeatureDescriptorList();

            var feature = new RecognitionRPC.FeatureDescriptor();
            feature.data = recog.faceDescriptor;
            feature.tags = recognizeTags;
            features.push(feature);

            featureList.feature_descriptors = features;

            RecognitionService.recognize({
              featureDescriptorList: featureList
            }, headers, (e, recogs) => {
              if (e) return error(e);
              // debug('recognition occurred', recogs);
              // matches: [{ tags: ['bar'], score: 0.234 }, {}...]
              cb({ matches: recogs.matches });
            });
          }
        }
        // Training Mode
      });
      //# facialRecognition map
    });
    //# rect_detection map


  },
  error: function (err) {
    debug(err);
  },
  ping: function () {
    if (_.has(Matrix.components, 'recognition')) {
      Matrix.components.recognition.ping();
    } else {
      console.log('Recognition available, not activated.');
    }
  },
  stop: function () {
    mode = 0;
  }
};
