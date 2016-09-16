var debug = debugLog('device.detection')

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
//
var detectionTypeList = [
'face'
]

//TODO: Evaluate if this is used. Detections might be happening past MALOS.
module.exports = {
  start: function(options){

    debug('start>', options);

    if (detectionTypeList.indexOf(options.name) === -1 ){
      return warn('No Matching Detction Found', options.name)
    }

    if ( Matrix.activeSensors.indexOf(options.name) !== -1 ){
      return warn('Duplicate Detection Initialization', options.name)
    }

    Matrix.activeSensors.push(options.name);

    // fetches the zero mq connections in a keyed object { config, update, ping... }
    var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers[options.name]);

    // put connections in options for component
    _.merge(options, mqs);

    var component = new Matrix.service.component(options);

    component.send(options.options, function(){
      debug('config sent>', options.name )

      if ( component.hasOwnProperty('read') ){
        component.read( function(data){

          debug('read>', data);

          // data is a collection
          //
          _.each(data, (d) => {

            // for re-routing to apps on the other side of emit
            d.type = options.name;

            // Forward back to the rest of the Application
            Matrix.events.emit('detection-emit', d);

          })

        })
      }
    });
  }
}
