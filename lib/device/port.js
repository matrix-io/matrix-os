var debug = debugLog('port')

module.exports={
  discovery: function(){
    // map ports by 10s
  },
  defaults: {
    led: 20021,
    microphone: 9010,
    speaker: 9020,
    gyroscope: 20013,
    camera: 9040,
    heartbeat: 9050,
    humidity: 20017,
    info: 20012
  },
  get: function(subdevice){
    if ( module.exports.defaults.hasOwnProperty(subdevice)) {
      var p = new Port(module.exports.defaults[subdevice]);
      return p;
    } else {
      console.error('No Port Defined for ', subdevice)
    }
  }
}

function Port(num){
  var o = {
    // input & config have same function
    input: num,
    config : num,
    send: num,
    error: num+2,
    ping: num+1,
    out: num+3,
    update: num+3,
    read: num+3
  }

  return o;
}
