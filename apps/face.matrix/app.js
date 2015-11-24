// localCamera seems weird, should just be by default
// CHANGE: loads local camera `matrix.cv()`
// CHANGE: loads camera `matrix.cv('video0')`
var options = { type: 'face', dwell: true, age: true, gender: true };
var face    = matrix.cam.init(null, options); 
//localCamera, stream (rtsp), with type of face applied -- should override initial options
// CHANGE: throw this away, and set the configuration together when initializing camera
// CHANGE: trigger event when configuration is set, instead initialize camera automatically (startCamera is redundant)

face.on('frameProcessed',function(data) {
	if(matrix._.size(data.faceObject.faces) > 0) console.log(JSON.stringify(data.faceObject.faces));
});