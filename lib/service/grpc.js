// We use GRPC to communicate with the MALOS and external services

var grpc = require('grpc');
var debug = debugLog('grpc');



const fs = require('fs')
const protosPath = __dirname + '/../../proto/matrix_io';

module.exports = {

  // this needs to run after PROTO 
  populate: function (Protos) {

    var gv = Protos.vision.VisionService;
    var gr = Protos.recognition.RecognitionService;

    var vFn = grpc.loadObject(gv, { protobufjsVersion: 6 });
    var rFn = grpc.loadObject(gr, { protobufjsVersion: 6 });

    module.exports.vision = vFn;
    module.exports.recognition = rFn;

  }
}


