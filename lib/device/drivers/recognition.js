// Unlike other drivers, this will use RPC directly

var matrixVision, matrixMalos, matrixRPC, RecognitionService;

var readLine = require('readline');
var fs = require('fs');
var grpc = require('grpc');

var trackingIds = new Set();

var trainingTags = [];

var N_DESCRIPTORS = 3
var RECOG_SERVICE_DEV = 'dev-recognize.matrix.one:50051'
var RECOG_SERVICE_PROD = 'recognize.matrix.one:50051'
var RECOG_SERVICE_RC = 'rc-recognize.matrix.one:50051'

var HOST_ADDRESS;


var mode = 0;
var modes = [ 'OFF', 'TRAIN', 'RECOGNIZE' ];

function getAllTags(cb){
  RecognitionService.getFeatureDescriptorTags({}, function(err, res){
    if (err) return cb(err);
    if (res.hasOwnProperty('feature_tags_for_device')){
      var tagData = res.feature_tags_for_device;
      var tags = [];
      tags = _.map( tagData, function(t){
        return _.map(t.tags, function(tag){
          return tag;
        });
      });
      tags = _.uniq(tags);

      cb(null, tags);
    } else {
      debug('no tags to fetch')
    }
  })
}

/**
 * Obtain a list of descriptors
 * @param  {[]}   uuids options.uuids for descriptors
 * @param  {[]}   tags  options.tags for descriptors, ignored when uuid is provided
 * @param  {Function} cb
 */
function getDescriptors(options, cb){
  if ( !_.isUndefined( options.uuids ) && !_.isUndefined( options.tags )) {
    console.warn('UUID will take precedence over tags');
  }
  var done = false;
  var descriptors = [];

  //TODO: Evaluate adding device_id to options
  async.doWhilst(
    function( cb ){
      RecognitionService.getFeatureDescriptors(options, (err, resp)=>{
        if (err) cb(err);
        descriptors.concat(resp.feature_descriptor_list)
        if ( _.isUndefined( resp.next_page_token) ){
          done = true;
        } else {
          options.next_page_token = resp.next_page_token;
        }
        cb(null, descriptors);
      })
    },
    function(){ return !done; },
    function( err, descriptors ){
      if (err) cb(err);
      cb(null, descriptors);
    }
  )
}

module.exports = {
  init: function(){
    var protoVisionBuilder = Matrix.service.protobuf.vision.recognition;
    matrixVision = protoVisionBuilder.build('admobilize_vision');
    var protoMalosBuilder = Matrix.service.protobuf.malos.driver;
    matrixMalos = protoMalosBuilder.build('matrix_malos');
    matrixRPC = Matrix.service.grpc.vision.recognition_service;


    var env = process.env;

    if ( env === 'dev' ){
      HOST_ADDRESS = RECOG_SERVICE_DEV;
    } else if (env === 'rc'){
      HOST_ADDRESS = RECOG_SERVICE_RC;
    } else {
      HOST_ADDRESS = RECOG_SERVICE_PROD;
    }


  },

  // configure malos first
  prepare: function(config, cb){
    var driverConfig = new matrixMalos.DriverConfig;
    driverConfig.set_delay_between_updates(0.05);
    driverConfig.set_timeout_after_last_ping(15000);
    driverConfig.malos_eye_config = new matrixMalos.MalosEyeConfig;
    var cameraConfig = matrixMalos.CameraConfig;
    cameraConfig.set_camera_id(0);
    cameraConfig.set_width(800);
    cameraConfig.set_height(600);
    driverConfig.malos_eye_config.set_camera_config(cameraConfig);
    cb(driverConfig.encode().toBuffer());
  },

  // happens after preparation
  config: function(){

    RecognitionService = new matrixRPC.RecognitionService(
      HOST_ADDRESS, grpc.credentials.createInsecure()
    );

    var eyeConfig = new matrixMalos.DriverConfig;
    eyeConfig.malos_eye_config = new matrixMalos.MalosEyeConfig;
    // FIXME: We should only need FACE_DESCRIPTOR here. @resolved?
    eyeConfig.malos_eye_config.object_to_detect.push(
      this.matrixMalosBuilder.EnumMalosEyeDetectionType.FACE_DEMOGRAPHICS);
    eyeConfig.malos_eye_config.object_to_detect.push(
      this.matrixMalosBuilder.EnumMalosEyeDetectionType.FACE_DESCRIPTOR);


    Matrix.components.recognition.config(config.encode().toBuffer());
  },
  train: function( tags ){
    mode = modes.indexOf('TRAIN');
    trainingTags = tags;
  },
  deleteAll: function(){
    getAllTags( function(tags) {
      RecognitionService.deleteFeatureDescriptors({
        tags: tags
      }, (err, res) => {
        if (err) console.error(err);
        if (res) debug(res);
      })
    })
  },

  read: function(buffer, cb){
    var result = matrixVision.VisionResult.decode(buffer);
    debug('>read', result);
    if ( result.vision_result.length > 0){
      _.map( result.vision_result, function(v) {
        if ( v.tag === 'TRACKING_START'){
          Matrix.service.track.add(v.tracking_id)
        } else if ( v.tag === 'TRACKING_END'){
          Matrix.service.track.remove(v.tracking_id)
        }
      });
    }

    if ( result.rect_detection.length > 0){
      _.map( result.rect_detection, function (r) {
        if ( !Matrix.service.track.has(r.tracking_id)){
          console.warn('Detection has no known Tracking Id', r, Matrix.service.track.getIds() );
        }
        _.map( r.recognitions, function(recog){
          if ( recog.tag === 'FACE_DESCRIPTOR'){

            // Training Mode
            if ( mode === modes.indexOf('TRAIN') ){
              var features = [];
              var featureList = new MatrixRPC.FeatureDescriptorList();

              for ( var i = 0; i< options.length; i++){
                var feature = new MatrixRPC.FeatureDescriptor();
                feature.uuid = r.tracking_id;
                feature.tags = trainingTags;
                feature.data = recog.face_descriptor;
                features.push(feature);
              }
              featureList.feature_descriptors = features;

              RecognitionService.storeFeatureDescriptors({
                'tags' : tags,
                'feature_descriptors' : feature_descriptors,
              }, function(err, res) {
                if (err) error(err);
                mode = 0;
                // send back to app via service-emit
                debug('T:', res);
                cb(_.extend(res, {
                  type: 'train-done'
                }));
              });

            // Recognize Mode
            } else if ( mode === modes.indexOf('RECOGNIZE')){
              var features = [];
              var featureList = new MatrixRPC.FeatureDescriptorList();

              for ( var i = 0; i< options.length; i++){
                var feature = new MatrixRPC.FeatureDescriptor();
                feature.data = options[i];
                features.push(feature);
              }
              featureList.feature_descriptors = features;

              RecognitionService.recognize({
                feature_descriptor_list: features
              }, (e, recogs) => {
                if (e) error(e);

                // [tags: ['foo','bar'], score: 0.234 }]
                var matches = recogs.matches;
                matches.forEach(function(m){
                  debug('R:', m)
                  // sends to app via service-emit
                  cb(_.extend(m, {
                    type: 'recognition-match',
                  }));

                })
              });

            }

            cb({
              id: r.tracking_id,
              descriptor: recog.face_descriptor
            });
          }
        })
      })
    }
  },
  error: function(err){},
  ping: function(){
    if ( _.has(Matrix.components, 'recognition')){
      Matrix.components.detection.ping();
    } else {
      console.error('No Detection Component Available for Ping')
      console.error('Components:',Matrix.components);
    }
  },



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
