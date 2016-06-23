var grpc = require('grpc')

module.exports = {
  run: function(options, cb){
    console.log(Matrix.service.grpc, options);
    var detectionClient = new Matrix.service.grpc.vision.vision_service.VisionService(
      '104.196.113.138:31339',
      grpc.credentials.createInsecure() );

    console.log(detectionClient);
    // kicks off detection request
    detectionClient.processImage(options, cb);
  }
}
