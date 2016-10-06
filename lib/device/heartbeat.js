var hbInterval;
var Heartbeat;

var debug = debugLog('heartbeat')

// Heartbeat signals the MALOS to do things and return data.
module.exports = {
  init: function () {
    Heartbeat = Matrix.service.protobuf.malos.heartbeat.build('matrix_heartbeat').Beat;
    this.start();

    // show heartbeat on debug
    if ( process.env.hasOwnProperty('DEBUG')){
      this.listener();
    }
  },
  start: function () {
    var self = this;
    hbInterval = setInterval( function(){
      self.beat();
    }, 1000);
  },
  beat: function(){
    var detections = [];
    var detectionList = [];
    var sensors = [];

    _.each(Matrix.activeApplications, function(app){

      _.each(app.sensors, function(s){
        //todo add lookup
        sensors.push( s.toUpperCase() );
      });

      _.each(app.services, function(d){
        // translate from services talk to protobuf talk
        var protoDetection = Matrix.service.detection.translateConfigToEnum(d);
        if ( !_.isUndefined( protoDetection )) {
          detections.push(protoDetection.toUpperCase());
        }
      });

    });

    var d = {};

    if (detections.length > 0){
      d.detections = { detection: detections[0] };
    }

    if (sensors.length > 0){
      d.sensors = _.uniq(sensors);
    }

    // trashy mapping for pings TODO: refactor
    if ( sensors.indexOf('GYROSCOPE') > -1 ){
      Matrix.device.drivers.gyroscope.ping();
    }

    if ( detections.indexOf('FACE') > -1){
      Matrix.device.drivers.face.ping();
    }

    // in case you need a fake heartbeat. you monster. 💚
    // d = {
    //   detections: {
    //     detection: 'FACE',
    //     zones: [{ x: 12.0, y: 12.0, width: 10.0, height: 10.0 }]
    //   },
    //   sensors: ['TEMPERATURE']
    // }

    debug('💓->', d);
    var beat = new Heartbeat(d);

    // console.log(beat);

    Matrix.service.zeromq.heartbeat(beat.encode().toBuffer());
  },
  stop: function () {
    clearInterval(hbInterval);
  },
  listener: function(cb){
    var count = 0;
    Matrix.service.zeromq.heartbeatMonitor(function(msg){
      // only show hb every 10 times
      count++;

      if ( count >= 10 ){
        var beat = Heartbeat.decode(msg);
        console.log('>>>>>>Heartbeat<<<<<<'.rainbow, beat)
        count = 0;
        if (_.isFunction(cb)){
          cb(beat);
        }
      }

    })
  }
}
