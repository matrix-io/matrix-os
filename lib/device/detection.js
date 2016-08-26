// VISION
//
// Matrix.proto.vision.VisionResult.RectangularDetection.algorithm;
// // 0 - face 1 - car 2 - thumb 3 - palm
// Matrix.proto.vision.VisionResult.RectangularDetection.tag;
// Matrix.proto.vision.VisionResult.RectangularDetection.confidence;
// Matrix.proto.vision.VisionResult.RectangularDetection.FacialRecognition;
// // 0 age 1 emotion 2 gender faceid headpose facefeatures
// Matrix.proto.vision.VisionResult.RectangularDetection.FacialRecognition.tag;
// Matrix.proto.vision.VisionResult.RectangularDetection.FacialRecognition.gender;
// Matrix.proto.vision.VisionResult.RectangularDetection.FacialRecognition.emotion;
// Matrix.proto.vision.VisionResult.RectangularDetection.FacialRecognition.face_signature;
// Matrix.proto.vision.VisionResult.RectangularDetection.image;
//
// Matrix.service.zeromq.addSubscriber('face', function(msg){
//   try {
//     var result = Matrix.protobuf.vision.VisionResult.decode(msg.substr('face'.length))
//   } catch (e){
//     console.error(e);
//   }
// })

//TODO: Evaluate if this is used. Detections might be happening past MALOS.
module.exports = {
  listener: function(cb){
    var server = new grpc.Server();
    server.addProtoService(Matrix.service.grpc.vision.vision_service.VisionService.service, {
      processImage: processImage
    });
  }
}
