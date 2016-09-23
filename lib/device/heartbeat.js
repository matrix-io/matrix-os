var hbInterval;
var Heartbeat;

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

      _.each(app.detections, function(d){
        if ( _.has( d, 'detection') && !_.isUndefined(d.detection)){
          var protoDetection = Matrix.service.detection.translateConfigToEnum(d.detection);
        }
        if ( !_.isUndefined(protoDetection) ){
          detectionList.push( protoDetection );
          detections.push( {
            detection: protoDetection,
            zones: d.zones
          });
        }
      });

    });

    var d = {
      detections : detections,
      sensors: _.uniq(sensors)
    };

    // trashy mapping for pings TODO: refactor
    if (d.sensors.indexOf('GYROSCOPE') > -1 ){
      Matrix.device.drivers.gyroscope.ping();
    }

    if ( detectionList.indexOf('FACE') > -1){
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

    // debug('<3->', d);
    var beat = new Heartbeat(d);

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
