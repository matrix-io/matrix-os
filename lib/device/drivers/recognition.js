// Unlike other drivers, this will use RPC directly

var matrixVision, matrixRPC, RecognitionService;

const EventEmitter = require('events');
const readLine = require('readline');
const fs = require('fs');
const grpc = require('grpc');

const N_DESCRIPTORS = 3
const RECOG_SERVICE_DEV = 'dev-recognize.matrix.one:50051'
const RECOG_SERVICE_PROD = 'recognize.matrix.one:50051'
const RECOG_SERVICE_RC = 'rc-recognize.matrix.one:50051'

let HOST_ADDRESS;

function getAllTags(cb){
  RecognitionService.getFeatureDescriptorTags({}, function(err, res){
    if (err) return cb(err);
    if (res.hasOwnProperty('feature_tags_for_device')){
      let tagData = res.feature_tags_for_device;
      let tags = [];
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
  let done = false;
  let descriptors = [];

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
    const protoVisionBuilder = Matrix.service.protobuf.vision.recognition;
    matrixVision = protoVisionBuilder.build('admobilize_vision');
    matrixRPC = Matrix.service.grpc.vision.recognition_service;


    const env = process.env;

    if ( env === 'dev' ){
      HOST_ADDRESS = RECOG_SERVICE_DEV;
    } else if (env === 'rc'){
      HOST_ADDRESS = RECOG_SERVICE_RC;
    } else {
      HOST_ADDRESS = RECOG_SERVICE_PROD;
    }

    RecognitionService = new matrixRPC.RecognitionService(
      HOST_ADDRESS, grpc.credentials.createInsecure()
    );

  },
  activate: function(options){

  },
  recognize: function( options ){
    let features = [];
    let featureList = new MatrixRPC.FeatureDescriptorList();

    for ( let i = 0; i< options.length; i++){
      let feature = new MatrixRPC.FeatureDescriptor();
      feature.data = options[i];
      features.push(feature);
    }
    featureList.feature_descriptors = features;

    RecognitionService.recognize({
      feature_descriptor_list: features
    }, (e, recogs) => {
      if (e) error(e);
      Matrix.components.recognition.read(recogs);
    });
  },
  train: function( options ){
    let features = [];
    let featureList = new MatrixRPC.FeatureDescriptorList();

    for ( let i = 0; i< options.length; i++){
      let feature = new MatrixRPC.FeatureDescriptor();
      feature.data = options[i];
      features.push(feature);
    }
    featureList.feature_descriptors = features;

    RecognitionService.train({
      feature_descriptor_list: features
    }, (e, recogs) => {
      if (e) error(e);
      Matrix.components.recognition.read(recogs);
    });
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
  getAllTags: getAllTags,
  read: function(buffer, cb){
    console.log('>read, should not fire');
    cb(buffer);
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


function readDescriptors (fileName, callback) {
  const rl = readLine.createInterface({
    input: fs.createReadStream(fileName),
  });
  let descriptors = [];
  rl.on('line', (line) => {
    descriptors.push(line.trim().split(' ').map(function(n) {
      return parseFloat(n) }));
  });
  rl.on('close', (line) => {
    callback(null, descriptors);
  });
}


class Trainer {
  constructor(options) {
    let protoPath = options.protoBase + '/vision/recognition_service.proto';
    this.grpcProtos = grpc.load(protoPath).admobilize_vision;
    this.client = new this.grpcProtos.RecognitionService(
      options.serviceHost,
      grpc.credentials.createInsecure());
  }

  train(tags, descriptors, callback) {
    let feature_descriptors = [];
    for (let i = 0; i < descriptors.length; ++i) {
      let feature = new this.grpcProtos.FeatureDescriptor();
      feature.data = descriptors[i];
      feature.tags = tags;
      feature_descriptors.push(feature);
    }
    this.client.storeFeatureDescriptors({
      'tags' : tags,
      'feature_descriptors' : feature_descriptors,
    }, function(err, res) {
      callback(err, res);
    });
  }
}

/*
class ListTags {
  constructor(options) {
    let protoPath = options.protoBase + '/vision/recognition_service.proto';
    this.grpcProtos = grpc.load(protoPath).admobilize_vision;
    this.client = new this.grpcProtos.RecognitionService(
      options.serviceHost,
      grpc.credentials.createInsecure());
  }

  all(callback) {
      'feature_descriptors' : feature_descriptors,
    }, function(err, res) {
      callback(err, res);
    });
  }
}
*/

// FIXME: Remove isDone and just stop listening to events.
// Use removeListener or removeAllListeners.
function getDescriptors(eye, howMany, verbose, done) {
  let descriptors = Array();
  let tracked_id;
  let isDone = false;

  if (verbose) {
    process.stderr.write('We need ' + howMany + ' descriptors\n');
  }

  eye.on('error', (msg) => {
    done(msg, null);
  });
  eye.on('trackingStart', (id) => {
    if (!tracked_id) {
      tracked_id = id;
    }
  });
  eye.on('faceDescriptor', (id, descriptor) => {
    if (id == tracked_id && !isDone) {
      descriptors.push(descriptor);
      if (descriptors.length >= howMany) {
        if (verbose) {
          process.stderr.write('Got descriptor: 100%\n');
        }
        done(null, descriptors);
        isDone = true;
        descriptors = []
      } else if (verbose) {
        process.stderr.write('Got descriptor: ' +
          Math.round(100 * descriptors.length / howMany) + '%\n');
      }
    }
  });
  eye.on('trackingEnd', (id, sessionTime, dwellTime) => {
    if (id == tracked_id && !isDone) {
      done(null, descriptors);
      isDone = true;
      descriptors = []
    }
  });
}

module.exports = {
  getDescriptors,
  readDescriptors,
  Recognizer,
  Trainer,
}

const N_DESCRIPTORS = 3
const PROTO_PATH = '../protocol-buffers/vision/recognition_service.proto'
const RECOGNITION_SERVICE_HOST = 'dev-recognize.matrix.one:50051'

var grpc = require('grpc')
var grpc_protos = grpc.load(PROTO_PATH).admobilize_vision
var client = new grpc_protos.RecognitionService(
  RECOGNITION_SERVICE_HOST,
  grpc.credentials.createInsecure())

function DeleteDescriptors(tags) {
  client.deleteFeatureDescriptors({
      'tags': tags,
    }, function(err, res) {
      console.log('err:', err)
      console.log('res:', res)
    }
  )
}

client.getFeatureDescriptorTags({
  },
  function(err, res) {
    if (err) {
      console.log('Error calling getFeatureDescriptorTags:', err)
    }
    if ('feature_tags_for_device' in res) {
      var tags_per_device = res['feature_tags_for_device']
      var all_tags = new Set()
      for (var i = 0; i < tags_per_device.length; ++i) {
        for (var j = 0; j < tags_per_device[i].tags.length; ++j) {
          all_tags.add(tags_per_device[i].tags[j])
        }
      }
      let tags = []
      all_tags.forEach(v => tags.push(v))
      if (tags.length > 0) {
        DeleteDescriptors(tags)
      } else {
        console.log('No descriptors to delete')
      }
    }
});
