matrix.init('face').then( function(data) {
  console.log('detection', data);
  matrix.send(data);
});
