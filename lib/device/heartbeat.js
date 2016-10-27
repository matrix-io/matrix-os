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
    }, 1000);
  },
  beat: function(){
    var detections = [];
    var detectionList = [];
    var sensors = [];

    _.each(Matrix.activeApplications, function(app){

      debug('activeApp->', app.name, app.config.sensors, app.config.services )


      _.each(app.config.sensors, function(s){
        //verify policy
        if ( app.policy.sensors[s] === true ){
          sensors.push( s.toUpperCase() );
        } else {
          debug( app.name, 'policy denies', s)
        }
      });

      // => ( { engine, type } , serviceName )
      _.each(app.config.services, function(d, k){

        var sName = Matrix.device.service.getEnumName(d.engine, d.type);

        if ( !_.isUndefined( d.type ) ) {

          // check type for policy
          if ( app.policy.services[d.type] === true ){
            detections.push(sName);
          } else {
            debug('policy denied', app.name, k, d.type )
          }
        } else {
          console.warn(k, ' service type is not defined');
        }
      });

    });

    var d = {};

    console.log(detections)

    if (detections.length > 0){
      d.detections = _.uniq(detections);
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

    // not dynamic at all 👊
    if ( d.detections.length > 0 ){
      Matrix.device.drivers.detection.ping()
      Matrix.device.drivers.gesture.ping()
    }

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
