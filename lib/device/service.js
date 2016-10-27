var debug = debugLog('device.service')

var gestureTypeList = [
'palm','thumb-up','fist','pinch'
]

var detectionTypeList = [
  'face'
]

//TODO: Evaluate if this is used. Detections might be happening past MALOS.
module.exports = {
  getEnumNameForType: function( engine, type ){
    //
    var typePrefix = '', typeSuffix = '_';
    if ( detectionTypeList.indexOf( engine ) > -1 ) {
      typePrefix = _.startCase(engine);
    }
    if ( gestureTypeList.indexOf( type )){
      typeSuffix += _.startCase(type);
    }
    return typePrefix+typeSuffix;
  },
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

    component.send(options.options, function(){
      debug('component config send>', driver, options.name )

      if ( component.hasOwnProperty('read') ){

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
