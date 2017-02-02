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

  },
  start: function () {
    var self = this;
    hbInterval = setInterval( function(){
      self.beat();
    }, 5000);
  },
  beat: function(){
    var services = [];
    var sensors = [];
    var integrations = [];

    _.each(Matrix.activeApplications, function(app){

      debug('activeApp->', app.name, app.config.sensors || '', app.config.services || '' )
      // debug('activeApp->', app )
      // debug('activeApp->', app.name )

      // disable policy for now until deploy is good

        _.each(app.config.sensors, function(s){
          //verify policy
          if ( app.policy.sensors[s] === true ){
            sensors.push( s.toUpperCase() );
          } else if ( process.env.POLICY_CHECK === true ){
            debug( app.name, 'policy denies', s)
          } else {
            sensors.push( s.toUpperCase() );
          }
        });

        // => ( { engine, type } , serviceName )
        _.each(app.config.services, function(d, k){

          var sName = Matrix.device.service.getEnumName(d.engine, d.type);

          if ( !_.isUndefined( d.type ) ) {

            // check type for policy
            if ( app.policy.services[d.type] === true ){
              services.push(sName);
            } else if (process.env.POLICY_CHECK === true) {
              debug('policy denied', app.name, k, d.type )
            } else {
              services.push(sName);
            }
          } else {
            console.warn(k, ' service type is not defined');
          }
        });

        _.each(app.config.integrations, function(i){
          //verify policy
          if ( app.policy.integrations[i] === true ){
            integrations.push( i.toUpperCase() );
          } else if ( process.env.POLICY_CHECK === true ){
            debug( app.name, 'policy denies', i)
          } else {
            integrations.push( i.toUpperCase() );
          }
        });
    });

    var d = {};

    if (services.length > 0){
      d.services = _.uniq(services);
    }

    if (sensors.length > 0){
      d.sensors = _.uniq(sensors);
    }

    if (integrations.length > 0){
      d.integrations = _.uniq(integrations);
    }

    firstBeat = false;

    // in case you need a fake heartbeat. you monster. 💚
    // d = {
    //   services: {
    //     detection: 'FACE',
    //     zones: [{ x: 12.0, y: 12.0, width: 10.0, height: 10.0 }]
    //   },
    //   sensors: ['TEMPERATURE']
    // }

    Matrix.events.emit('heart-beat', d);
    var beat = new Heartbeat(d);

    // console.log(beat);

    Matrix.service.zeromq.heartbeat(beat.encode().toBuffer());

    //FIXME: Heartbeat needs to manually restart services right now. Waiting on MALOS
    // Remove when done. Also change HB to 1000.
    // TODO: Do another one of these for services
    _.each( d.sensors, function(s){
      if ( _.has(Matrix.device.drivers, s.toLowerCase() ) ){
        Matrix.device.drivers[s.toLowerCase()].ping();
      } else {
        console.warn(s, 'sensor is not available as a component');
      }
    })

    _.each( d.integrations, function(i){
      if (_.has(Matrix.device.drivers, i.toLowerCase())) {
        Matrix.device.drivers[i.toLowerCase()].ping();
      } else {
        console.warn(i, 'integration is not available as a component');
      }
    })

    // not dynamic at all 👊
    if ( services.length > 0 ){
      if ( Matrix.device.service.isDetection(d.services[0])){
        // Matrix.device.drivers.detection.config(d.services[0])
        Matrix.device.drivers.detection.ping();
      } else if ( Matrix.device.service.isGesture(d.services[0])) {
        // Matrix.device.drivers.gesture.config(d.services[0])
        Matrix.device.drivers.gesture.ping();
      }
    }
  },
  stop: function () {
    clearInterval(hbInterval);
  }
}
