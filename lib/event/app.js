var debug = debugLog('app-event');

// Listen for global detection events sent to device, route to application via provided cb
function setupCVHandlers(name, cb) {
  var listener = function(data) {
    if (_.has(data, 'appName') && data.appName === name) {
      // Filter Data Points by Name
      cb(null, data);
    } else {
      cb(new Error(name + ' CV Datapoint malformed : '.red + data))
    }
  };
  Matrix.events.on('detection', listener)

  // for remove later
  return listener;
}


// manage crosstalk events going to apps
// type
// data
function handleDeviceEvent(event) {
  debug('[ss]->[ct2de]', event);
  // terrible,     ss wrapper, pb wrapper, pb payload
  var payload = event.payload.data.payload;
  var type = event.payload.data.type;

  // for namespaced routing
  if (_.has(event, 'payload.data.eventName')) {
    payload.eventName = event.payload.data.eventName;
  }

  // needed to route to device
  payload.type = type;
  Matrix.events.emit(type, payload);
}

module.exports = {
    init: function() {
      // Parse and Direct Data sent from Apps
      Matrix.events.on('app-emit', function dataHandler(data) {
        debug('app(data)->[M]'.green, data);
        Matrix.service.stream.sendDataPoint(data.payload);
      });
      Matrix.events.on('app-log', Matrix.service.stream.streamLog);
      Matrix.events.on('device-event', handleDeviceEvent);
    },
    setupCrosstalk: setupAppListeners,
    setupCVHandlers: setupCVHandlers,
    closeProcessHandler: function(code, number) {
      debug('Close:', code, number);
    },
    exitProcessHandler: function(code, number) {
      debug('Exit:', code, number);

      // references app.process from manager.js
      var app = this;

      _.remove(Matrix.activeApplications, function(activeProcess) {
        if (_.has(activeProcess, 'process')) {
          return activeProcess.process.pid === app.pid;
        } else {
          return false;
        }
      });

      // TODO: clean up listeners
      if (_.has(app, 'process.handlers')) {
        Matrix.events.removeListener('app-message', app.process.handlers.crosstalk);
        Matrix.events.removeListener('app-' + app.appName + '-message', app.process.handlers.crosstalk);
      }

      // TODO: stop VES instances on app exit
      console.warn('VES Instances yet not halted on app stop');
    },

    // handle events coming from app
    /**
     * @param m
     * @param m.type - event type
     * @param m.payload - accompanying data
     */
    messageProcessHandler: function messageHandler(m) {
      // debug('App Message Handler ->'.green, m)

      //lookup activeApplication record
      var appRecord = Matrix.service.manager.getAppRecordForPid(this.pid);

      if (_.isUndefined(appRecord)) {
        console.warn('Message recieved from app without active application record', this.spawnargs[1]);
        return;
      }

      var appName = appRecord.name;
      var appConfig = appRecord.config;
      var appPolicy = appRecord.policy;

      // don't show led debugs
      if (m.type !== 'led-image') {
        debug('app('.green + appName.green + ')->'.green, m.type, m);
      }

      //TODO: refactor #113965661
      if (m.type === 'app-emit') {
        debug('== app-emit'.blue, m.payload);

        // TODO: Hacky for demo. Type should be outside data
        // m.payload.data.type = m.payload.data.type;

        m.payload.appName = appName.toLowerCase();
        m.payload.appVersion = appConfig.version || 0;
        // Reroutes to dataHandler above via events
        Matrix.events.emit('app-emit', m);

      } else if (m.type === 'service-init') {

        if (_.has(process.env, 'CHECK_SERVICES') && appRecord.validInitServiceCmds.indexOf(m.name) === -1) {
          debug('Valid Init Cmds:', appRecord.validInitServiceCmds);
          return console.error(appName.grey, 'application policy does not allow', m.name, 'service');
        } else {
          Matrix.events.emit('service-init', m);
        }
      } else if (m.type === 'service-cmd') {

        if (_.has(process.env, 'CHECK_SERVICES') && appRecord.validInitServiceCmds.indexOf(m.name) === -1) {
          debug('Valid Init Cmds:', appRecord.validInitServiceCmds);
          return console.error(appName.grey, 'application policy does not allow', m.name, 'service');
        } else {
          Matrix.events.emit('service-cmd', m);
        }

      } else if (m.type === 'sensor-init') {
        // policy lookup
        if (_.has(process.env, 'CHECK_POLICY') && (!_.has(appPolicy.sensors, m.name) || appPolicy.sensors[m.name] === false)) {
          console.error(appName.grey, 'application policy does not allow', m.name, 'sensor');
        } else {
          Matrix.events.emit('sensor-init', m);
        }

      } else if (m.type === 'zigbee-net-cmd') {

        Matrix.events.emit('zigbee-net', m);

      } else if (m.type === 'zigbee-light-cmd') {
        Matrix.events.emit('zigbee-light', m);
      } else if (m.type === 'gpio-open') {
        Matrix.events.emit('gpio-open', m);
      } else if (m.type === 'gpio-write') {
        Matrix.events.emit('gpio-write', m);
      } else if (m.type === 'gpio-close') {
        Matrix.events.emit('gpio-close', m);
      } else if (m.type === 'train-start') {
        Matrix.events.emit('train-start', m)
      } else if (m.type === 'app-message') {

        // TODO: Add policy check to see if app can emit this message
        // should need events: global

        // sending global interapp message for device
        Matrix.events.emit('app-message', m);

        //send msgs to infrastructure
        Matrix.service.stream.sendAppEvent({
          data: m,
          appName: appName,
          appVersion: appConfig.version
        });

      } else if (m.type.match(/app-.*-message/)) {

        // TODO: Add policy check here
        // should need events: AppName or events: AppName::EventName

        // sending specific interapp message for device
        Matrix.events.emit(m.type, m);

        //send msgs to infrastructure
        Matrix.service.stream.sendAppEvent({
          data: m,
          appName: appName,
          appVersion: appConfig.version
        });

      } else if (m.type === 'app-config') {
        if (!_.isObject(m.payload)) {
          return console.error('Bad Configuration Sent. Not an Object.'.red)
        }

        // Route elsewhere
        _.extend(m, {
          name: appName.toLowerCase(),
          version: (_.isNumber(m.payload.version)) ? m.payload.version : m.payload.version.replace(/\./g, '') || 0
        });

        Matrix.events.emit('app-config', m);

        // manage local record
        // add what system need to knows from config
        _.extend(appRecord, {
          sensors: m.payload.sensors,
          types: m.payload.dataTypes,
          integrations: m.payload.integrations
            // TODO: Add services here
        });

      } else if (m.type === 'trigger') {
        Matrix.events.emit('trigger-group', m);

      } else if (m.type === 'service-cmd') {
        console.warn('service-cmd sent no listener')
      } else if (m.type === 'led-image') {
        debug('[M]->#0', m.payload[0]);
        if (_.has(Matrix.components, 'led')) {
          Matrix.components.led.send(m.payload);
        } else {
          error('LED Component Failed to Register', Matrix.components)
        }
      } else if (m.type === 'log') {
        var logmsg;
        try {
          logmsg = JSON.parse(m.payload);
        } catch (e) {
          logmsg = m.payload
        }
        console.log(`(app)(${appName}) - `, logmsg);
      } else {
        warn('Invalid Process Message from Matrix App:', appName.green, m);
      }
    },

    triggerHandler: function triggerHandler(data) {
      debug('trigger msg> '.blue, data);
      Matrix.events.emit('app-message', data);
    }



  }
  // for dynamic messaging
function setupAppListeners(name, cb) {
  debug('app('.green + name.green + ')->listeners'.green);
  Matrix.events.on('app-' + name + '-message', cb);
  Matrix.events.on('app-message', cb);
  return cb;
}