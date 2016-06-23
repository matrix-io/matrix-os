
// var grpc = require('grpc')

module.exports = {

  run: function(options, cb){
    var detectionClient = new Matrix.service.grpc.vision_service.VisionService(
      'dev-detect.matrix.one:80',
      grpc.credentials.createInsecure()
    );

    var ves = grpc.load('proto/detect_service.proto').admobilize_vision

    var detectionClient = new ves.VisionService(
      'dev-detect.matrix.one:80',
      grpc.credentials.createInsecure()
    );

    // kicks off detection request
    detectionClient.Detect(options, cb);
  }
}
