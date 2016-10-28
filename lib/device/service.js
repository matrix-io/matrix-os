var debug = debugLog('device.service')

var gestureTypeList = [
'palm','thumb-up','fist','pinch'
]

var detectionTypeList = [
  'face'
]

//TODO: Evaluate if this is used. Detections might be happening past MALOS.
module.exports = {
  // maps between matrix land and protocol buffer detection enums
  // expect blood here
  getEnumName: function( engine, type ){
    var typePrefix = '', typeSuffix = '_';

    if ( engine === 'gesture' ){
      typePrefix = 'HAND'
    }

    if ( detectionTypeList.indexOf( engine ) > -1 ) {
      typePrefix = _.upperCase(engine.replace('-','_'));
    }
    if ( gestureTypeList.indexOf( type ) > -1 ){
      typeSuffix += _.upperCase(type.replace('-','_'));
    }
    return typePrefix+typeSuffix;
  },

  // used by heartbeat, which has access to enum name
  isGesture : function( enumName ){
    return (gestureTypeList.indexOf( enumName.split('_')[1].toLowerCase().replace('_', '-') ) > -1)
  },
  isDetection: function( enumName ){
    return (detectionTypeList.indexOf( enumName.split('_')[1].toLowerCase().replace('_', '-') ) > -1)
  },

  // this is kicked off from app.init -> service-init event
  start: function(options){

    debug('start>', options);

    var allTypes = gestureTypeList.concat(detectionTypeList);

    if ( allTypes.indexOf(options.name) === -1 ){
      debug(allTypes)
      return warn('No Matching Service Found', options.name)
    }

    if ( Matrix.activeServices.indexOf(options.name) !== -1 ){
      debug(Matrix.activeServices)
      return warn('Duplicate Service Initialization', options.name)
    }

    Matrix.activeSensors.push(options.name);

    var driver;
    if ( detectionTypeList.indexOf(options.name) !== -1 ){
      driver = 'detection';
    } else if ( gestureTypeList.indexOf(options.name) !== -1 ){
      driver = 'gesture';
    } else {
      // add new services here
      return console.error('Invalid Service', options.name);
    }

    // fetches the zero mq connections in a keyed object { config, update, ping... }
    var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers[driver]);

    // put connections in options for component - swap name and type
    _.assign(options, mqs, { name : driver, type: options.name });

    // construct with component Class
    var component = new Matrix.service.component(options);

    // initial configuration
    component.send(options.options, function(){
      debug('component config send>', driver, options.type )

      if ( component.hasOwnProperty('read') ){

        debug('component read setup')

        // setup read handler
        component.read( function(componentCollection){

          debug( options.name + ')C read>', componentCollection);

          _.each(componentCollection, (d) => {

            // for re-routing to apps on the other side of emit
            d.type = options.name;

            // Forward back to the rest of the Application
            Matrix.events.emit('service-emit', d);

          })

        })
      }
    });

    component.error(function(data){
      console.error('SERVICE ERROR', data);
    })
  }
}
