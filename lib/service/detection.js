//TODO: Deprecated. Keep it around for now, we will need to connect with detection server later

var grpc = require('grpc')
var debug = debugLog('detection');

module.exports = {
  process: function(options, cb){
    console.log('Detection>', options);
    var detectionClient = new Matrix.service.grpc.vision.vision_service.VisionService(
      '104.196.113.138:31339',
      grpc.credentials.createInsecure() );

    // kicks off detection request
    detectionClient.processImage(options, cb);
  },
  setupLocal: function(algo, cb){
    debug('start local', algo)
    var zmq = require('zmq')

    // Ping the driver.
    var sock_ping = zmq.socket('push')
    sock_ping.connect('tcp://127.0.0.1:9374');
    sock_ping.send(algo);


    // Subscribe to the events that we did ping for.
    // The events will stop arriving unless we send more pings.
    // Not being sent in this example.
    var sock = zmq.socket('sub')
    sock.connect('tcp://127.0.0.1:9375');
    sock.subscribe(algo);
    debug(algo, 'subscriber connected')

    // const fs = require('fs')
    // // var messages = Matrix.service.protobuf.vision.vision;
    // // var msgBuilt = messages.build('admobilize_vision')

    // Wait for messages.
    sock.on('message', function(message) {
      cb(message);
      // try {
      //   vision_result = msgBuilt.VisionResult.decode(message.slice(algo.length))
      //   // console.log(vision_result)
      //   // Checking the first detection only!
      //   console.log('Objects of type ', algo, 'at ', vision_result.rect_detection[0].location)
      // } catch (err) {
      //   console.log(err)
      // }
    });
  },
  //NOTE: when vision.proto is updated, update this
  translateConfigToEnum: function (input) {
    if ( !_.isUndefined(input) ){
      var map = {
        'thumb-up':  'HAND_THUMB',
        'palm-open': 'HAND_PALM',
        'palm-closed': '',
        'face': 'FACE',
        'face-id': '',
        'vehicle-count': 'CAR'
      }
      if ( map.hasOwnProperty(input) === false){
        return console.error('No Detection for ', input)
      }
      if ( map[input].length === 0 ){
        return console.error('Detection', input, 'has no MVF tag.')
      }

      return map[input];
    }
  },
  translateConfigToFacialEnum: function (input) {
    var map = {
      'age': 'AGE',
      'emotion':'EMOTION',
      'gender':'GENDER',
      'id':'FACE_ID',
      'pose':'HEAD_POST',
      'features':'FACE_FEATURES'
    }
    if ( map.hasOwnProperty(input) === false){
      return console.error('No Facial Detection for ', input)
    }
    if ( map[input].length === 0 ){
      return console.error('Detection', input, 'has no Facial Recognition tag.')
    }
  }
}




///interest = 'palm'
// interest = 'face'
// #interest = 'thumb_up'
