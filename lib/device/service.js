var debug = debugLog('device.service')

var gestureTypeList = [
'palm','thumb-up','fist','pinch'
]

var detectionTypeList = [
  'face','demographics'
]

//TODO: Evaluate if this is used. Detections might be happening past MALOS.
module.exports = {
  // maps between matrix land and protocol buffer detection enums
  // TODO: fix this to be better. very brittle mapping between mos and malos
  getEnumName: function( engine, type ){
    var typePrefix = '', typeSuffix = '';

    if ( engine === 'gesture' ){
      typePrefix = 'HAND';
      if ( gestureTypeList.indexOf( type ) > -1 ){
        typeSuffix += '_' + _.upperCase(type.replace('-','_'));
      }
    }

    // refactor these
    if ( engine === 'detection'){
      typePrefix = 'FACE';
      if ( type === 'demographics'){
        typeSuffix = '_DEMOGRAPHICS'
      }
    }
    return typePrefix+typeSuffix;
  },

  // used by heartbeat, which has access to enum name
  isGesture : function( enumName ){
    debug('gesture?', enumName)
    if ( enumName.split('_').length < 2 ){
      return false;
    }
    return (gestureTypeList.indexOf( enumName.split('_')[1].toLowerCase().replace('_', '-') ) > -1)
  },
  isDetection: function( enumName ){
    debug('detection?', enumName)

    if ( enumName === 'FACE' ){
      return true;
    }

    if ( enumName.split('_').length < 2 ){
      return false;
    }

    return ( detectionTypeList.indexOf(
      enumName.split('_')[1]
        .toLowerCase()
        .replace('_', '-')
      ) > -1 )
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

    var enumName = Matrix.device.service.getEnumName( driver, options.name );

    // put connections in options for component - swap options name and type
    _.assign(options, mqs, {
      name : driver,
      type: options.name,
      enumName: enumName
    });

    // construct with component Class
    var component = new Matrix.service.component(options);

    // initial configuration
    component.send(options, function(){
      debug('component config send>', driver, options.type )

      // secondary setup - cv config
      Matrix.device.drivers[driver].config( enumName );

      if ( component.hasOwnProperty('read') ){

        debug('component read setup')

        // setup read handler
        component.read( function(componentCollection){

          debug( options.name + ')C read>', componentCollection);

          _.each(componentCollection, (d) => {

            // for re-routing to apps on the other side of emit
            d.engine = driver;
            d.type = options.type;
            d.enumName = enumName;

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
