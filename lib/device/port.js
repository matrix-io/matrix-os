module.exports={
  discovery: function(){
    // map ports by 10s
  },
  map: {
    //default
    led: 9000,
    microphone: 9010,
    speaker: 9020,
    imu: 9030,
    camera: 9040,
    heartbeat: 9050
  }
}

function Port(num){
  this.map = {
    input : num,
    error: num+1,
    ping: num+2,
    out: num+3
  }

  return this;
}
