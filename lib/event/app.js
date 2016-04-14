

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
  closeProcessHandler: function(code, number){
    debug('Close:', code, number);
    _.remove( Matrix.activeApplications, function (activeProcess) {
      return activeProcess.pid === app.process.pid;
    });
  },
  exitProcessHandler: function(code, number) {
    debug('Exit:', code, number);
    _.remove( Matrix.activeApplications, function (activeProcess) {
      return activeProcess.pid === app.process.pid;
    });
  },
  messageProcessHandler: function messageHandler(m) {

    debug('app('.green + name.green + ')->'.green, m.type);
    debug('== app-emit'.blue, m.payload);
    //TODO: refactor #113965661
    if (m.type === 'app-emit') {

      // TODO: Hacky for demo. Type should be outside data
      // m.payload.data.type = m.payload.data.type;

      m.payload.appName = name.toLowerCase();
      m.payload.appVersion = appConfig.version || 0;
      // Reroutes to dataHandler above via events
      Matrix.events.emit('app-emit', m);

    } else if (m.type === 'sensor-init') {
      // so we can lookup sensors on activeProcess
      if ( app.process.sensors.indexOf( m.name ) === -1 ){
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
      _.extend(m, {
        name: m.payload.name.toLowerCase(),
        version: ( _.isNumber( m.payload.version ) ) ? m.payload.version : m.payload.version.replace(/\./g, '') || 0
      });

      _.extend(app.process, {
        // todo add system need to knows from config
        sensors: m.payload.sensors,
        types: m.payload.dataTypes,
        integrations: m.payload.integrations
      });

      Matrix.events.emit('app-config', m);
    } else if (m.type ==='trigger' ) {
      Matrix.events.emit('trigger-group', m);

    } else {
      warn('Invalid Process Message from Matrix', m);
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
