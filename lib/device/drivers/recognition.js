// Unlike other drivers, this will use RPC directly

var matrixVision, matrixMalos, matrixRPC, matrixRecognition, matrixRecognitionService,
  RecognitionService,
  protoVisionBuilder,
  protoMalosBuilder;

var debug = debugLog('recognition');

var readLine = require('readline');
var fs = require('fs');
var grpc = require('grpc');

var trackingIds = new Set();

var trainingTags = [];
var recognizeTags = [];

var N_DESCRIPTORS = 3
var RECOG_SERVICE_DEV = 'dev-recognize.matrix.one:50051'
var RECOG_SERVICE_PROD = 'recognize.matrix.one:50051'
var RECOG_SERVICE_RC = 'rc-recognize.matrix.one:50051'

var HOST_ADDRESS;

var headers;


var mode = 0;
var modes = ['OFF', 'TRAIN', 'RECOGNIZE'];


/**
 * Returns all trained tags in easy format.
 * @param {*} cb -> ( err, [tags] ) 
 */
function getAllTags(cb) {
  initializeRecognitionService()
  RecognitionService.getFeatureDescriptorTags({}, headers, function(err, res) {
    if (err) return cb(err);
    if (res.hasOwnProperty('feature_tags_for_device')) {
      var tagData = res.feature_tags_for_device;
      var tags = [];
      tags = _.map(tagData, function(t) {
        return _.map(t.tags, function(tag) {
          return tag;
        });
      });
      tags = _.uniq(tags);
      tags = _.flattenDeep(tags);

      cb(null, tags);
    } else {
      debug('no tags to fetch')
      cb(null, []);
    }
  })
}

/**
 * 
 * @param {[]} tags - tags to delete 
 * @param {*} cb 
 */
function deleteTags(tags, cb) {
  debug('delete>', tags);
  initializeRecognitionService()

  RecognitionService.deleteFeatureDescriptors({ tags: tags }, headers, function deletedTags(err, resp) {
    if (err) console.error(err);
    console.log('deleted>', resp);
    if (_.isFunction(cb)) cb();
  })
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
  initializeRecognitionService()

  //TODO: Evaluate adding device_id to options
  async.doWhilst(
    function(cb) {
      RecognitionService.getFeatureDescriptors(options, headers, (err, resp) => {
        if (err) cb(err);
        descriptors.concat(resp.feature_descriptor_list)
        if (_.isUndefined(resp.next_page_token)) {
          done = true;
        } else {
          options.next_page_token = resp.next_page_token;
        }
        cb(null, descriptors);
      })
    },
    function() { return !done; },
    function(err, descriptors) {
      if (err) cb(err);
      cb(null, descriptors);
    }
  )
}

function initializeRecognitionService() {
  if (_.isUndefined(RecognitionService)) {
    var env = process.env.NODE_ENV;

    if (env === 'dev') {
      HOST_ADDRESS = RECOG_SERVICE_DEV;
    } else if (env === 'rc') {
      HOST_ADDRESS = RECOG_SERVICE_RC;
    } else {
      HOST_ADDRESS = RECOG_SERVICE_PROD;
    }

    headers = new grpc.Metadata();
    headers.add('authorization', 'Bearer ' + Matrix.deviceToken)

    var credentials = grpc.credentials.createSsl();
    RecognitionService = new matrixRPC.RecognitionService({
      HOST_ADDRESS,
      credentials
    });

    console.log('RecogService:', HOST_ADDRESS)
  }
}

module.exports = {
  commands: ['recognition'],
  init: function() {
    var protoVisionBuilder = Matrix.service.protobuf.vision.vision;
    var protoRecognitionBuilder = Matrix.service.protobuf.vision.recognition;
    var protoRecognitionServiceBuilder = Matrix.service.protobuf.vision.recognition_service;
    matrixVision = protoVisionBuilder.build('admobilize_vision');
    matrixRecognitionService = protoRecognitionServiceBuilder.build('admobilize_vision');
    matrixRecognition = protoRecognitionBuilder.build('admobilize_vision');
    protoMalosBuilder = Matrix.service.protobuf.malos.driver;
    matrixMalos = protoMalosBuilder.build('matrix_malos');
    matrixRPC = Matrix.service.grpc.vision.recognition_service;





  },

  getTags: getAllTags,

  // configure malos first
  prepare: function(component, cb) {
    var options = component.options;
    var driverConfig = new matrixMalos.DriverConfig;
    driverConfig.set_delay_between_updates(0.05);
    driverConfig.set_timeout_after_last_ping(15);
    driverConfig.malos_eye_config = new matrixMalos.MalosEyeConfig;
    var cameraConfig = new matrixMalos.CameraConfig;
    cameraConfig.set_camera_id(0);
    cameraConfig.set_width(800);
    cameraConfig.set_height(600);
    driverConfig.malos_eye_config.set_camera_config(cameraConfig);
    cb(driverConfig.encode().toBuffer());

    // parse mode option
    if (options.hasOwnProperty('mode')) {
      var m = modes.indexOf(options.mode.toUpperCase())
      if (m !== -1) {
        mode = m;
      } else { console.warn('Invalid Recognition Mode:', options.mode) }
    } else if (options.train && options.recognize === true) {
      // parse train and recognize options
      console.warn('Cannot set both train and recognize to true.')
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
  config: function() {
    initializeRecognitionService()


    // setup malos_eye_
    var eyeConfig = new matrixMalos.DriverConfig;
    eyeConfig.malos_eye_config = new matrixMalos.MalosEyeConfig;
    // FIXME: We should only need FACE_DESCRIPTOR here. @resolved?
    eyeConfig.malos_eye_config.object_to_detect.push(
      matrixMalos.EnumMalosEyeDetectionType.FACE_DEMOGRAPHICS);
    eyeConfig.malos_eye_config.object_to_detect.push(
      matrixMalos.EnumMalosEyeDetectionType.FACE_DESCRIPTOR);


    Matrix.components.recognition.config(eyeConfig.encode().toBuffer());

    // Additional Inits
    getAllTags(function(err, tags) {
      if (err) console.error(err);
      console.log('Recognition Trained Tags:'.yellow, tags);
      // uncomment to clear training on service start
      // if (!_.isEmpty(tags)) deleteTags(tags);
    })
  },

  delete: deleteTags,


  deleteAll: function() {
    getAllTags(function(tags) {
      RecognitionService.deleteFeatureDescriptors({
        tags: tags
      }, headers, (err, res) => {
        if (err) console.error(err);
        if (res) debug(res);
      })
    })
  },

  read: function(buffer, cb) {
    // debug('read>', buffer);
    if (_.isUndefined(buffer)) { return; }
    var result = new matrixVision.VisionResult.decode(buffer);

    // debug('>read', result)

    if (result.vision_event.length > 0) {
      _.each(result.vision_event, function(v) {
        debug('>v_e', v.tag, v.tracking_id);
        if (v.tag === 'TRACKING_START') {
          Matrix.service.track.add(v.tracking_id)
        } else if (v.tag === 'TRACKING_END') {
          Matrix.service.track.remove(v.tracking_id)
        }
      });
    }

    _.each(result.rect_detection, function(r) {
        if (!Matrix.service.track.has(r.tracking_id)) {
          console.warn('Detection has no Tracking Id', r, Matrix.service.track.getIds());
        }

        var tId = r.tracking_id.toString();
        debug('track id>', tId);

        _.each(r.facial_recognition, function(recog) {

            if (recog.tag === 'FACE_DESCRIPTOR') {

              if (mode === modes.indexOf('TRAIN')) {

                var trainTarget = 7;

                Matrix.service.track.addDescriptor(tId, recog.face_descriptor);
                var dCount = Matrix.service.track.getDescriptors(tId).length;
                console.log('Trained: ', dCount);

                if (dCount >= trainTarget) {

                  debug('>face_recog', recog.tag, tId);

                  var descriptors = _.map(Matrix.service.track.getDescriptors(tId), function(d) {
                    var feature = new matrixRPC.FeatureDescriptor();
                    feature.tags = trainingTags;
                    feature.data = d;
                    return feature;
                  })

                  Matrix.service.track.clearDescriptors(tId);

                  debug('Send to RS Training >>> ', descriptors, trainingTags);
                  RecognitionService.storeFeatureDescriptors({
                    'tags': trainingTags,
                    'feature_descriptors': descriptors,
                  }, headers, function(err, res) {
                    if (err) return error(err);
                    debug('train >', res);
                    // Send results back to app
                    cb({ uuids: Array.from(res), done: true, serviceType: 'recognition-train' });
                  })
                } else {
                  // send back count info for progress
                  cb({ count: dCount, target: trainTarget, done: false, serviceType: 'recognition-train' });
                }
                // end training

              } else if (mode === modes.indexOf('RECOGNIZE')) {

                debug('recog', recog)
                var features = [];
                var featureList = new matrixRPC.FeatureDescriptorList();

                var feature = new matrixRPC.FeatureDescriptor();
                feature.data = recog.face_descriptor;
                feature.tags = recognizeTags;
                features.push(feature);

                featureList.feature_descriptors = features;

                RecognitionService.recognize({
                  feature_descriptor_list: featureList
                }, headers, (e, recogs) => {
                  if (e) return error(e);

                  // matches: [{ tags: ['bar'], score: 0.234 }, {}...]
                  // transform this into { tagName: 0.2323, tag2Name: 0.4543 }
                  var o = {};
                  _.each(recogs.matches, function(m) {
                    o[m.tags[0]] = m.score;
                  });

                  debug(' recog >', o);

                  cb({ matches: o, serviceType: 'recognition-recognize' });
                });
              }
            }
            // Training Mode
          })
          //# facial_recognition map
      })
      //# rect_detection map


  },
  error: function(err) {
    debug(err);
  },
  ping: function() {
    if (_.has(Matrix.components, 'recognition')) {
      Matrix.components.recognition.ping();
    } else {
      console.error('No Recognition Component Available for Ping')
      console.error('Components:', _.keys(Matrix.components));
    }
  }
}