var zmq = require('zmq')
var debug = debugLog('zeromq');
// var sub = zmq.socket('sub');
// var pub = zmq.socket('pub');


var handlerMap = [];

var ledSock = zmq.socket('push');
ledSock.connect('tcp://127.0.0.1:9275');
// var sensor = zmq.socket('sub');

module.exports = {
  init: function(){
    // TODO: figure out resolver

    console.log('LED connecting listening on 9275');
    // pub.bindSync('tcp://127.0.0.1:9374')
    // sub.on('message', messageHandler)


    // socket = zmq.socket('req');
    //
    // // Register to monitoring events
    // socket.on('connect', function(fd, ep) {console.log('connect, endpoint:', ep);});
    // socket.on('connect_delay', function(fd, ep) {console.log('connect_delay, endpoint:', ep);});
    // socket.on('connect_retry', function(fd, ep) {console.log('connect_retry, endpoint:', ep);});
    // socket.on('listen', function(fd, ep) {console.log('listen, endpoint:', ep);});
    // socket.on('bind_error', function(fd, ep) {console.log('bind_error, endpoint:', ep);});
    // socket.on('accept', function(fd, ep) {console.log('accept, endpoint:', ep);});
    // socket.on('accept_error', function(fd, ep) {console.log('accept_error, endpoint:', ep);});
    // socket.on('close', function(fd, ep) {console.log('close, endpoint:', ep);});
    // socket.on('close_error', function(fd, ep) {console.log('close_error, endpoint:', ep);});
    // socket.on('disconnect', function(fd, ep) {console.log('disconnect, endpoint:', ep);});

    //
    // sensor.on('connect', function(){
    //   debug('Sensors Onlne');
    // });
  },
  led: function(data){
    // log('LED UPDATE', data);
    ledSock.send(data);
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

    pub.send(channel, data);
  },
  ping: function(channel){
    pub.send(channel)
  }
}

function rpcHandler(channel, data){

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
}


// send messages to appropriate CB's
// these are incoming
function messageHandler(topic, message){
  debug('>', topic);
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
        } else if ( k === 'dummy-sensor' || k === 'test') {
          data = Matrix.protobuf.hal.Dummy.decode(message);
        } else if ( k === 'dummy-detection') {
          data = Matrix.protobuf.vision.Dummy.decode(message);
        } else if ( k === '') {
        }
      } catch (e) {
        cb(e);
      }

      console.log('D>', topic, data);

      cb(null, message);
    }
  })
}
