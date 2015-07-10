module.exports = {
  init: function(){
    Matrix.events.on('sensor-event', sensorEventListener );
  }
}

function sensorEventListener( data ){
  console.log('Sensor Event', data);
}