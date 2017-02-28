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

function getAllTags(cb) {
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
    }
  })
}

function deleteTags(tags, cb) {
  console.log('delete', tags);
  var deleteReq = new matrixRecognitionService.DeleteFeatureDescriptorsRequest;

  deleteReq.tags = tags;

  console.log(deleteReq);

  RecognitionService.deleteFeatureDescriptors(deleteReq, function deletedTags(err, resp) {
    if (err) console.error(err);
    console.log('deletedTags', resp);
    cb();
  })
}

function startDetection() {

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


    var env = process.env.NODE_ENV;

    if (env === 'dev') {
      HOST_ADDRESS = RECOG_SERVICE_DEV;
    } else if (env === 'rc') {
      HOST_ADDRESS = RECOG_SERVICE_RC;
    } else {
      HOST_ADDRESS = RECOG_SERVICE_PROD;
    }


  },

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

    headers = new grpc.Metadata();
    headers.add('authorization', 'Bearer ' + Matrix.deviceToken)

    var credentials = grpc.credentials.createSsl();

    RecognitionService = new matrixRPC.RecognitionService(
      HOST_ADDRESS, credentials
    );

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
      console.log('Saved Tags:'.yellow, tags);
      if ( !_.isEmpty(tags)) deleteTags(tags);
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
                    cb({ uuids: Array.from(res) });
                  })
                } else {
                  // send back count info for progress
                  cb({ count: dCount, target: trainTarget });
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

                  cb({ matches: o });
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

//
// function readDescriptors (fileName, callback) {
//   var rl = readLine.createInterface({
//     input: fs.createReadStream(fileName),
//   });
//   var descriptors = [];
//   rl.on('line', (line) => {
//     descriptors.push(line.trim().split(' ').map(function(n) {
//       return parseFloat(n) }));
//   });
//   rl.on('close', (line) => {
//     callback(null, descriptors);
//   });
// }
//
//
// class Trainer {
//   constructor(options) {
//     var protoPath = options.protoBase + '/vision/recognition_service.proto';
//     this.grpcProtos = grpc.load(protoPath).admobilize_vision;
//     this.client = new this.grpcProtos.RecognitionService(
//       options.serviceHost,
//       grpc.credentials.createInsecure());
//   }
//
//   train(tags, descriptors, callback) {
//     var feature_descriptors = [];
//     for (var i = 0; i < descriptors.length; ++i) {
//       var feature = new this.grpcProtos.FeatureDescriptor();
//       feature.data = descriptors[i];
//       feature.tags = tags;
//       feature_descriptors.push(feature);
//     }
//     this.client.storeFeatureDescriptors({
//       'tags' : tags,
//       'feature_descriptors' : feature_descriptors,
//     }, function(err, res) {
//       callback(err, res);
//     });
//   }
// }
//
// /*
// class ListTags {
//   varructor(options) {
//     var protoPath = options.protoBase + '/vision/recognition_service.proto';
//     this.grpcProtos = grpc.load(protoPath).admobilize_vision;
//     this.client = new this.grpcProtos.RecognitionService(
//       options.serviceHost,
//       grpc.credentials.createInsecure());
//   }
//
//   all(callback) {
//       'feature_descriptors' : feature_descriptors,
//     }, function(err, res) {
//       callback(err, res);
//     });
//   }
// }
// */
//
// // FIXME: Remove isDone and just stop listening to events.
// // Use removeListener or removeAllListeners.
// function getDescriptors(eye, howMany, verbose, done) {
//   var descriptors = Array();
//   var tracked_id;
//   var isDone = false;
//
//   if (verbose) {
//     process.stderr.write('We need ' + howMany + ' descriptors\n');
//   }
//
//   eye.on('error', (msg) => {
//     done(msg, null);
//   });
//   eye.on('trackingStart', (id) => {
//     if (!tracked_id) {
//       tracked_id = id;
//     }
//   });
//   eye.on('faceDescriptor', (id, descriptor) => {
//     if (id == tracked_id && !isDone) {
//       descriptors.push(descriptor);
//       if (descriptors.length >= howMany) {
//         if (verbose) {
//           process.stderr.write('Got descriptor: 100%\n');
//         }
//         done(null, descriptors);
//         isDone = true;
//         descriptors = []
//       } else if (verbose) {
//         process.stderr.write('Got descriptor: ' +
//           Math.round(100 * descriptors.length / howMany) + '%\n');
//       }
//     }
//   });
//   eye.on('trackingEnd', (id, sessionTime, dwellTime) => {
//     if (id == tracked_id && !isDone) {
//       done(null, descriptors);
//       isDone = true;
//       descriptors = []
//     }
//   });
// }
//
//
// var N_DESCRIPTORS = 3
// var PROTO_PATH = '../protocol-buffers/vision/recognition_service.proto'
// var RECOGNITION_SERVICE_HOST = 'dev-recognize.matrix.one:50051'
//
// var grpc = require('grpc')
// var grpc_protos = grpc.load(PROTO_PATH).admobilize_vision
// var client = new grpc_protos.RecognitionService(
//   RECOGNITION_SERVICE_HOST,
//   grpc.credentials.createInsecure())
//
// function DeleteDescriptors(tags) {
//   client.deleteFeatureDescriptors({
//       'tags': tags,
//     }, function(err, res) {
//       console.log('err:', err)
//       console.log('res:', res)
//     }
//   )
// }
//
// client.getFeatureDescriptorTags({
//   },
//   function(err, res) {
//     if (err) {
//       console.log('Error calling getFeatureDescriptorTags:', err)
//     }
//     if ('feature_tags_for_device' in res) {
//       var tags_per_device = res['feature_tags_for_device']
//       var all_tags = new Set()
//       for (var i = 0; i < tags_per_device.length; ++i) {
//         for (var j = 0; j < tags_per_device[i].tags.length; ++j) {
//           all_tags.add(tags_per_device[i].tags[j])
//         }
//       }
//       var tags = []
//       all_tags.forEach(v => tags.push(v))
//       if (tags.length > 0) {
//         DeleteDescriptors(tags)
//       } else {
//         console.log('No descriptors to delete')
//       }
//     }
// });