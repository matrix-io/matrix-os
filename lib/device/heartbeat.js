var hbInterval;
var Heartbeat;

var debug = debugLog('heartbeat')


// hack
var firstBeat = true;

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
      //TODO: when heartbeat works, makes sense to reduce to 1000
    }, 10000);
  },
  beat: function(){
    var detections = [];
    var detectionList = [];
    var sensors = [];

    _.each(Matrix.activeApplications, function(app){

      // console.log(app)

      _.each(app.config.sensors, function(s){
        //verify policy
        if ( app.policy.sensors[s] === true ){
          sensors.push( s.toUpperCase() );
        } else {
          debug( app.name, 'policy denies', s)
        }
      });

      _.each(app.config.services, function(d, k){
        // translate from services talk to protobuf talk
        var protoDetection = Matrix.service.detection.translateConfigToEnum(k);
        if ( !_.isUndefined( protoDetection ) ) {
          if ( app.policy.services[k] === true ){
            detections.push(protoDetection.toUpperCase());
          } else {
            debug( app.name, 'policy denies', k )
          }
        } else {
          console.warn(k, ' service is not defined');
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

    firstBeat = false;

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

    //FIXME: Heartbeat needs to manually restart services right now. Waiting on MALOS
    // Remove when done. Also change HB to 1000.
    // TODO: Do another one of these for detections
    _.each( d.sensors, function(s){
      if ( _.has(Matrix.device.drivers, s.toLowerCase() ) ){
        Matrix.device.drivers[s.toLowerCase()].ping();
      } else {
        console.warn(s, 'sensor is not available as a component');
      }
    })


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
