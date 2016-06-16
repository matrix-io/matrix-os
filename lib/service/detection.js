var detectionClient;

var grpc = require('grpc')

module.exports = {
  init: function () {
    if (_.isUndefined(detectionClient)) {
      detectionClient = new Matrix.service.grpc.vision_service.VisionService(
        'dev-detect.matrix.one:80',
        grpc.credentials.createInsecure()
      );
    }
  },

  // detectFaces, detectDemographics, etc are defined on detection - RPC
  // @see http://www.grpc.io/docs/tutorials/basic/node.html
  face: function (options, cb) {
    checkClient();
    console.log(require('util').inspect(detectionClient));
    detectionClient.detectFaces(options, cb);
  },
  demographics: function (options, cb) {
    checkClient();
    detectionClient.detectDemographics(options, cb);
  },
  gesture: function (options, cb) {
    checkClient();
    detectionClient.detectGestures(options, cb);
  }
}

function checkClient() {
  if (_.isUndefined(detectionClient)) {
    console.error('detectionClient not initialized. Matrix.service.detection.init()')
    return false;
  } else {
    return true;
  }
}
