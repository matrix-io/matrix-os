

// Listen for global detection events sent to device, route to application via provided cb
function setupCVHandlers(name, cb){
  Matrix.events.on('detection', function(data){
    if ( _.has(data, 'appName') && data.appName === name){
      // Filter Data Points by Name
      cb(null, data);
    } else {
      cb(new Error(name+ ' CV Datapoint malformed : '.red + data))
    }
  })
}

module.exports = {
  init: function(){
    // Parse and Direct Data sent from Apps
    Matrix.events.on('app-emit', function dataHandler(data) {
      debug('app(data)->[M]'.green, data);
      Matrix.service.stream.sendDataPoint(data.payload);
    });
    Matrix.events.on('app-log', Matrix.service.stream.streamLog);
  },
  setupLocalCrosstalk: setupAppListeners,
  setupCVHandlers: setupCVHandlers,
  closeProcessHandler: function(code, number){
    debug('Close:', code, number);
    _.remove( Matrix.activeApplications, function (activeProcess) {
      // ??
      return activeProcess.process.pid === app.process.pid;
    });
  },
  exitProcessHandler: function(code, number) {
    debug('Exit:', code, number);
    // references app.process from manager.js
    var app = this;
    _.remove( Matrix.activeApplications, function (activeProcess) {
      // ??
      return activeProcess.process.pid === app.pid;
    });
  },
  messageProcessHandler: function messageHandler(m) {

    //lookup activeApplication record
    var appRecord = Matrix.service.manager.getAppRecordForPid(this.pid);
    var appName = appRecord.name;
    var appConfig = appRecord.config;

    debug('app('.green + appName.green + ')->'.green, m.type);
    debug('== app-emit'.blue, m.payload);
    //TODO: refactor #113965661
    if (m.type === 'app-emit') {

      // TODO: Hacky for demo. Type should be outside data
      // m.payload.data.type = m.payload.data.type;

      m.payload.appName = appName.toLowerCase();
      m.payload.appVersion = appConfig.version || 0;
      // Reroutes to dataHandler above via events
      Matrix.events.emit('app-emit', m);

    } else if (m.type === 'sensor-init') {
      // so we can lookup sensors on activeProcess
      if ( appConfig.sensors.indexOf( m.name ) === -1 ){
        console.error(app.name.grey, 'application not configured for', m.name.blue, 'sensor');
      } else {
        Matrix.events.emit('sensor-init', m);
      }

    } else if (m.type === 'app-message') {

      // sending global interapp message
      Matrix.events.emit('app-message', m);

    } else if (m.type.match(/app-.*-message/)) {

      // sending specific interapp message
      Matrix.events.emit(m.type, m);

    } else if (m.type === 'app-config') {
      if ( !_.isObject(m.payload)){
        return console.error('Bad Configuration Sent. Not an Object.'.red)
      }

      // Route elsewhere
      _.extend(m, {
        name: appName.toLowerCase(),
        version: ( _.isNumber( m.payload.version ) ) ? m.payload.version : m.payload.version.replace(/\./g, '') || 0
      });

      Matrix.events.emit('app-config', m);

      // manage local record
      _.extend(appRecord, {
        // todo add system need to knows from config
        sensors: m.payload.sensors,
        types: m.payload.dataTypes,
        integrations: m.payload.integrations
      });

    } else if (m.type ==='trigger' ) {
      Matrix.events.emit('trigger-group', m);

    } else if (m.type === 'detection-init') {
      // fire up a detection server
      // var options = {
      //   schema: {
      //     name: appRecord.name,
      //     shortname: appRecord.name.toLowerCase(),
      //     payload: appRecord.config.dataTypes
      //   }
      // }
      // Matrix.service.detection.init();
      // load rpc call for given detection
      // TODO: support multiple detections
      var options = { image: require('fs').readFileSync('./test/stdtestimage.jpg'), detection: [m.type.toUpperCase()] }
      // face, car, etc
      Matrix.service.detection.run( options, function( err, d ){
        if (err) return console.error(err);
        debug('detection::rpc::', m.name, d);
        var dataPoint = d;
        dataPoint.appName = appName;

        // get this 🐤back to the app
        Matrix.events.emit('detection', dataPoint)
      });
    } else if ( m.type === 'led-image'){
      Matrix.device.led.update( m.payload );
    } else {
      warn('Invalid Process Message from Matrix App:', appName.green, m);
    }
  },

  triggerHandler: function triggerHandler(data){
    debug('trigger msg> '.blue, data);
    Matrix.events.emit('app-message', data);
  }



}
// for dynamic messaging
function setupAppListeners(name, cb) {
  debug('app('.green + name.green + ')->listeners'.green);
  Matrix.events.on('app-' + name + '-message', cb);
  Matrix.events.on('app-message', cb);
}
