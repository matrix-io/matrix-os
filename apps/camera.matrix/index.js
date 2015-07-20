process.on('message', function(m) {

  if (m.init === true){
    doInit();
  }

});
