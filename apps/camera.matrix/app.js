process.on('message', function(m) {

  if (m.init === true){
    doInit();
  }

});


function doInit() {
  console.log('TODO: THIS IS A CAMERA APP = WOOT +!')

  //fake camera for now
  setInterval( function() {
    process.send({ type: 'data-point', payload: { cameraData: true } });
  }, 5000)

}
