var protoBuilder, matrixMalosBuilder;

var debug = debugLog('zigbee');

var knownBulbs = new Set();

module.exports = {
  // init runs automatically, wait for app to request component creation
  init: function(){
    protoBuilder = Matrix.service.protobuf.malos.driver;
    // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')
  },
  read: function(buffer){
    console.log('zigbee>', buffer );
    var data = new matrixMalosBuilder.ZigBeeAnnounce.decode(buffer);
    console.log(data);
    // var detect = new matrixVisionMalosBuilder.VisionResult.decode(buffer).toRaw();
    //
    // // unlike other sensors, this one is a collection
    // return _.map(detect.rect_detection, function (d) {
    //   return {
    //     detection: d.tag,
    //     recognition: d.facial_recognition
    //   }
    // });
  },
  prepare: function(options, cb){
    if (_.isFunction(options)){
      cb = options;
      options = {};
    }
    if (_.isUndefined(options)){
      options = {};
    }

    if ( !_.has(options, 'refresh')){
      options.refresh = 1.0;
    } else if ( parseFloat(options.refresh) === options.refresh ){
      options.refresh = options.refresh / 1000
    }
    if ( !_.has(options, 'timeout')){
      options.timeout = 10.0;
    } else if ( parseFloat(options.timeout) === options.timeout ){
        options.timeout = options.timeout / 1000
    }

    // map options to protobuf config
    var config = new matrixMalosBuilder.DriverConfig;
    var bulbConfig = new matrixMalosBuilder.ZigbeeBulbConfig;


    // 2 seconds between updates.
    config.set_delay_between_updates(0.2);
    config.set.zigbee_bulb(bulb_cfg);

    debug('zigbee start')
    cb(config.encode().toBuffer());
  },
  ping: function(){
    if ( _.has(Matrix.components, 'zigbee')){
      Matrix.components.zigbee.ping();
    } else {
      console.error('No Zigbee Component Available for Ping')
      console.error('Components:',Matrix.components);
    }
  },
  error: function(err){
    console.error('Face', err);
  }
}
