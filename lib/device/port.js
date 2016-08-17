module.exports={
  discovery: function(){
    // map ports by 10s
  },
  defaults: {
    led: 20013,
    microphone: 9010,
    speaker: 9020,
    imu: 20021,
    camera: 9040,
    heartbeat: 9050,
    humidity: 20017
  },
  get: function(subdevice){
    if ( module.exports.defaults.hasOwnProperty(subdevice)) {
      return new Port(module.exports.defaults[subdevice]);
    } else {
      console.error('No Port Defined for ', subdevice)
    }
  }
}

function Port(num){
  var o = {
    input : num,
    error: num+2,
    ping: num+1,
    out: num+3
  }

  return o;
}
