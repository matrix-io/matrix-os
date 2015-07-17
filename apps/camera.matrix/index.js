process.on('message', function(m) {

  if (m.init === true){
    doInit();
  }

});


function doInit() {
  console.log('TODO: Init Camera Here')

  //fake camera for now
  setInterval( function() {
    process.send({ type: 'data-point', payload: { cameraData: true } });
  }, 1000)

}
