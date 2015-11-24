var options = { type: 'face', dwell: true, age: false, gender: true };
var face = matrix.cv('localCamera', options);

face.on('frameProcessed', function(data){
  console.log('frameProcessed',data);
  //should be event for face start -- currently missing this event
  //should contain first detections of all demographic info and so forth
});

face.on('detectionStopped', function(data){
  console.log('detectionStopped',data);
  //should be event for face start -- currently missing this event
  //should contain first detections of all demographic info and so forth
});

face.on('detectionError', function(data){
  console.log('detectionError',data);
  //should be event for face start -- currently missing this event
  //should contain first detections of all demographic info and so forth
});

face.on('cameraStarted', function(data){
  console.log('cameraStarted',data);
  //should be event for face start -- currently missing this event
  //should contain first detections of all demographic info and so forth
});

face.on('cameraStopped', function(data){
  console.log('cameraStopped',data);
  //should be event for face start -- currently missing this event
  //should contain first detections of all demographic info and so forth
});

face.on('cameraFailed', function(data){
  console.log('cameraFailed',data);
  //should be event for face start -- currently missing this event
  //should contain first detections of all demographic info and so forth
});

face.on('sourceFailed', function(data){
  console.log('sourceFailed',data);
  //should be event for face start -- currently missing this event
  //should contain first detections of all demographic info and so forth
});

face.on('sourceStarted', function(data){
  console.log('sourceStarted',data);
  //should be event for face start -- currently missing this event
  //should contain first detections of all demographic info and so forth
});