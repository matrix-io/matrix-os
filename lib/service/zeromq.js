/* jshint -W058 */
// For the protos


var zmq = require('zmq')
var debug = debugLog('zeromq');
// var sub = zmq.socket('sub');
// var pub = zmq.socket('pub');


var handlerMap = [];

var ledSock = zmq.socket('push');
var imuConfig = zmq.socket('push');
var imuError = zmq.socket('sub');
var imuUpdate = zmq.socket('sub');
var imuPing = zmq.socket('push');

var heartbeatSocket = zmq.socket('push');

var heartbeatListener = zmq.socket('pull');

var inputSockets = {};
var outputSockets = {};

module.exports = {
  heartbeatMonitor : function(cb){
    heartbeatListener.on('message', cb);
  },
  heartbeat: function(msg){
    heartbeatSocket.send(msg);
  },
  init: function(){
    ledSock.connect('tcp://127.0.0.1:' + Matrix.device.port.get('led').input );
    imuConfig.connect('tcp://127.0.0.1:' + Matrix.device.port.get('imu').config );
    imuError.connect('tcp://127.0.0.1:' + Matrix.device.port.get('imu').error );
    imuUpdate.connect('tcp://127.0.0.1:' + Matrix.device.port.get('imu').out );
    imuPing.connect('tcp://127.0.0.1:' + Matrix.device.port.get('imu').ping );

    heartbeatSocket.connect('tcp://127.0.0.1:'+ Matrix.device.port.get('heartbeat').input );
    heartbeatListener.connect('tcp://127.0.0.1:' + Matrix.device.port.get('heartbeat').out );

  },

  led: function(data){
    debug('[zmq]->[LED]'.blue, data);
    ledSock.send(data);
  },

  gyro: {
    error: function(cb){
      imuError.subscribe('')
      imuError.on('message', function(error_message) {
        cb(error_message.toString('utf8'));
      });
    },
    config: function(configProto){
      imuConfig.send( configProto )
    },
    update: function(cb){
      debug('update init')
      imuUpdate.subscribe('')
      imuUpdate.on('message', function(data){
        debug('[gyro]->[zmq]', data);
        cb(data);
      });
    },
    ping: function(){
      imuPing.send('');
    }
  },

  // TODO: input and output should be implemented as streams
  // zeromq.wifi( single )
  wifi: {
    send: function(data){
      debug('[zmq]->[wifi]'.blue, data);
      console.warn('wifi not in')
      wifiSock.send(data);
    },
    recieve: function(cb){
      debug('[zmq]<-[wifi]'.blue, cb);
      console.warn('wifi not in')
      wifiSock.on('message', cb);
    }
  },

  zwave: {
    send: function(data){
      debug('[zmq]->[zwave]'.blue, data);
      console.warn('zwave not in')
      zwaveSock.send(data);
    },
    recieve: function(cb){
      debug('[zmq]<-[zwave]'.blue, cb);
      console.warn('zwave not in')
      zwaveSock.on('message', cb);
    }
  },

  zigbee: {
    send: function(data){
      debug('[zmq]->[zigbee]'.blue, data);
      console.warn('zigbee not in')
      zigbeeSock.send(data);
    },
    recieve: function(cb){
      debug('[zmq]<-[zigbee]'.blue, cb);
      console.warn('zigbee not in')
      zigbeeSock.on('message', cb);
    }
  },

  // for device management, update / boot, etc
  device: function(data){
    debug('[zmq]->[device]'.blue, data);
    console.warn('device not in')
    // deviceSock.send(data);
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
  },
  monitor: function(){
    // Create a socket
    // socket = zmq.socket('req');
    //
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
    // // Handle monitor error
    // socket.on('monitor_error', function(err) {
    //     console.log('Error in monitoring: %s, will restart monitoring in 5 seconds', err);
    //     setTimeout(function() { socket.monitor(500, 0); }, 5000);
    // });
    //
    // // Call monitor, check for events every 500ms and get all available events.
    // console.log('Start monitoring...');
    // socket.monitor(500, 0);
    // socket.connect('tcp://127.0.0.1:9991');
    //
    // setTimeout(function() {
    //     console.log('Stop the monitoring...');
    //     socket.unmonitor();
    // }, 20000);
  },
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
