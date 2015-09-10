/** Camera App
/app.js
**/
//initialization code loads raw camera lib
//activates camera
//passes configuration
module.exports = camera;

/** App 1 - device abc123 **/
/** Building an App -- Initialize Once **/
/** Start Stream when camera is initialized here **/
var cam1 = matrix.init( 'camera' );
var led = matrix.init( 'led', { } );
var audio = matrix.init( 'audio', { } );

/** Detect a Face (OpenCV) **/
/** Initialize Data Transmission to Server **/
var stream1 = cam1.detect( 'face' , {} ).stream();

/**
    blob detection for objects
    identify type of blob generation --> motion, color, shape
    uniqueness
    detection of the object, of type face
    -- cam1.detect( 'face' ) ^^^^^^^^
**/

/**
    Options for Detect
    blob -> face, blob -> human, blob -> vehicle
**/

/** App Activity Inter-Device **/
stream1.has('age').between(0,21).then(function(out){
  /** queues on triggers **/
  led.on('red');
  /** queues on triggers **/
  audio.play('alert1');
});

/** App 2 **/
/** accessible internally **/
var temp = matrix.init( 'temp' );
var display = matrix.init( 'display' );
/** accessible externally **/
temp.stream();

/** do something **/
temp.has('value').above(25).then(function(out){
  display.serve('icecreamshop.mp4');
});

/** App 3 **/
/** accessible internally **/
var temp = matrix.init('temp');
var file = matrix.file;
var request = matrix.request;
var display = matrix.init('display');
/** accessible externally **/
temp.stream();

/** Get file -- needs to be a blocking operation, maybe happen on app initialization **/
var file1 = file.pull('http://...');

/** do something **/
temp.has('value').above(25).then(function(out){
  display.serve(file1.name);
});

/** App 4 **/
/** accessible internally **/
var events = matrix.events;
var display = matrix.init('display');

/** do something with other device **/
events.has('device','abc123').and.has('age').between(0,21).then(function(out){
  display.serve('icecreamshop.mp4');
});

/** App 5 -- intercom **/
var mic = matrix.init('mic');
var stream = mic.listen();
