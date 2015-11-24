var options = { type: 'face', dwell: true, age: false, gender: true };
var face = matrix.cv('localCamera', options);

face.on('frameProcessed', function(data){
  if(matrix._.size(data.faceObject.faces) > 0) console.log(data);
  //should be event for face start -- currently missing this event
  //should contain first detections of all demographic info and so forth
});