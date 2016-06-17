var zmq = require('zmq')
var sub = zmq.socket('sub');
var pub = zmq.socket('pub');

var handlerMap = [];

// TODO: figure out resolver
sub.bindSync('tcp://127.0.0.1:9375');
pub.bindSync('tcp://127.0.0.1:9374')

module.exports = {
  init: function(){
    console.log('ZeroMQ listening on 9375');
    sub.on('message', messageHandler)
  },
  // Zeromq.addSubscriber('temp', function(msg))
  addSubscriber: function(channel, cb){
    // ping the service
    pub.send(channel);
    // get messages
    sub.subscribe(channel);
    // handle messages
    handlerMap.push({ channel: cb });
  },
  removeSubscriber: function(channel){
    delete handlerMap[channel];
  },
  publish: function(channel, data){

    // send message modification
    if ( channel === 'led' && _.has(data, 'led') && _.isArray(data.led)){
      var builder = Matrix.protobuf.hal.build('matrix_hal')
      var everloopImage = new builder.EverloopImage;

      // go through lights
      for (var i = 0; i < 35; ++i) {
        var ledValue = new builder.LedValue;
        ledValue.setRed(data.led[i].red);
        ledValue.setGreen(data.led[i].green);
        ledValue.setBlue(data.led[i].blue);
        ledValue.setWhite(data.led[i].white);

        everLoopImage.led.push(ledValue)
      }
    }
    pub.send(channel, data);
  },
  ping: function(channel){
    pub.send(channel)
  }
}


// send messages to appropriate CB's
// these are incoming
function messageHandler(topic, message){
  _.each(handlerMap, function(cb,k ){
    if ( message.indexOf(k) === 0 ){
      // remove message prefix
      message = message.substr(k.length)

      var data;
      try {

        // put message through appropriate protobufs
        if ( k === 'face'){
          data = Matrix.protobuf.vision.VisionResult.decode(message);
        } else if ( k === 'temperature') {
          data = Matrix.protobuf.hal.LedValue.decode(message);
        } else if ( k === 'humidity') {
          data = Matrix.protobuf.hal.Humidity.decode(message);
        } else if ( k === 'vehicle') {
          data = Matrix.protobuf.vision.VisionResult.decode(message)
        } else if ( k === 'gps') {
          console.warn('gps not in yet')
          data = Matrix.protobuf.hal.GPS.decode(message);
        } else if ( k === 'communication') {
        } else if ( k === 'led') {
          data = Matrix.protobuf.hal.EverloopImage.decode(message)
        } else if ( k === 'dummy' || k === 'test') {
          data = Matrix.protobuf.hal.Dummy.decode(message);
        } else if ( k === '') {
        } else if ( k === '') {
        }
      } catch (e) {
        cb(e);
      }

      console.log(data);

      cb(null, message);
    }
  })
}
