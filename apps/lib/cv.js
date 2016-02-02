var opencv;

var lib = {
  config: function(camera, appOptions) {
    var options = {
      'height': 640,
      'width':  480,
      'minSize':  20, //50,
      'maxSize': 400, //-1,
      'drawObjects': false,
      'processAge': false, //should be minimized to "age"
      'processGender': true, // should be "gender"
      'processEmotion': true, // should be "emotion"
      'processDwell':true, // should be "dwell"
      'show': false, // "show should = preview"
      'save': false, // should be "store", or "save"
      'debug': false,
      'processUniques': true, //should be just "uniques"
      'frameRate': 5,  //number of frames per second
      'device': 0, //this seems like duplicate code, could be normalized
      'bufferImage': null,
      'detection': { // should just be part of configuration (e.g. face), see above
        type: "humans",
        detector: 3
      },
      "directory": __dirname + "/../../opencv-node-sdk/admobilize-detection-manager/admobilize-detection/data"
      //should have a default path that works, seems to never work with default path
    };
    if(options === undefined || options === null) {
      // do nothing
    } else {
      options.processAge = appOptions.age || false;
      options.processGender = appOptions.gender || false;
      options.processEmotion = appOptions.emotion || false;
      options.processDwell = appOptions.dwell || false;
      if(appOptions.type === 'face') {
        options.detection = { type: 'humans', detector: 3 };
      }
    }

    //set the camera
    if(camera === undefined || camera === null) {
      options.camera = 'localCamera';
    } else {
      options.camera = camera;
    }

    //update options
    return options;
  },

  init: function(camera, appOptions) {
    console.log('open cv init');
    
    try {
      opencv = require('opencv-node-sdk');
    } catch(e) {
      console.error('MATRIX CV could not initialize. Please make sure the MATRIX OS has been updated -- see error:', e);
    }

    var options = lib.config(camera, appOptions);
    var cv = new opencv({ "cameraId" : options.camera });
    cv.setConfiguration(options,function(){
      log('start camera')

      cv.startCamera(0, function(err){
        if(err) { console.error(err); } else {
          log('start detect');
          cv.startContinuousDetection();
        }
      });
    });
    return cv;
  }
}

module.exports = lib;
