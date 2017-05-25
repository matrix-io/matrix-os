var debug = debugLog('port')

module.exports = {
  discovery: function() {
    // map ports by 10s
  },
  defaults: {
    accelerometer: 20013,
    altitude: 20025,
    camera: 9040,
    detect_info: 22012,
    detection: 22013,
    gesture: 22013,
    gpio: 20049,
    gyroscope: 20013,
    heartbeat: 9050,
    humidity: 20017,
    info: 20012,
    ir: 20041,
    led: 20021,
    magnetometer: 20013,
    mic: 20037,
    microphone: 9010,
    pressure: 20025,
    recognition: 22013,
    servo: 20045,
    speaker: 9020,
    temperature: 20017,
    uv: 20029,
    zigbee: 40001,
    wakeword: 60001,
  },
  get: function(subdevice) {
    if (Matrix.device.port.defaults.hasOwnProperty(subdevice)) {
      var p = new Port(Matrix.device.port.defaults[subdevice]);
      return p;
    } else {
      console.error('No Port Defined for ', subdevice)
    }
  }
}

function Port(num) {
  var o = {
    // input & config have same function
    input: num,
    config: num,
    send: num,
    error: num + 2,
    ping: num + 1,
    out: num + 3,
    update: num + 3,
    read: num + 3
  }

  return o;
}