// localCamera seems weird, should just be by default
// CHANGE: loads local camera `matrix.cv()`
// CHANGE: loads camera `matrix.cv('video0')`
var options = { type: 'face', dwell: true, age: true, gender: true, emotion: true };
var face    = matrix.camera.init(null, options); 
//localCamera, stream (rtsp), with type of face applied -- should override initial options
// CHANGE: throw this away, and set the configuration together when initializing camera
// CHANGE: trigger event when configuration is set, instead initialize camera automatically (startCamera is redundant)

face.on('frameProcessed',function(data) {
	if(matrix._.size(data.faceObject.faces) > 0) {
		console.log(JSON.stringify(data.faceObject.faces));
		matrix._.forEach(data.faceObject.faces, function(face, key) {
			face.sex = (face.sex === 0) ? 'male' : 'female';
			face.looked = (face.isView === true) ? 'true' : 'false';
			matrix.type('face').send(face);
			//[{"uniqueId":"1448395663-4796249989411-181993","dwellTime":0.50509,"emotion":"unknown","age":55,"sex":0,"isView":true}]
		});
	}
});

