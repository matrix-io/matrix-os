module.exports = function(message) {
  console.log('[M]('+ this.appName +') send ->', message);
  if ( _.isNull(message) ){
    return error('null message from matrix.send')
  }
  // if (!message.hasOwnProperty('data')){
  //   message = { data: message };
  // }

  var type, msgObj = {};
  if( this.hasOwnProperty('dataType') ) {
    type = this.dataType;

    //reset variable for next send
    delete this.dataType;
  } else {
    type = this.appName;
    // return error('No TYPE specified in matrix.send. Use matrix.type().send()')
  }

  // check config dataTypes for type (array or object lookup)
  var dataTypes = this.config.dataTypes;

  if ( !_.isPlainObject(dataTypes) || _.isEmpty(dataTypes) ) {
    return error('matrix.send used without dataTypes defined in config')
  }

  /* TYPES WHICH ARE UNDEFINED IN CONFIG SHALL NOT PASS         .
     Only pass config.dataType defined types                 \^/|
     TODO: depreciate when dynamic schema works again       _/ \|_*/

  if ( !dataTypes.hasOwnProperty(type) && type !== this.appName ){
    console.log(type, 'not found in config datatypes');
  } else if ( type === this.appName ){
    // no .type() used
    msgObj = message;
  } else {

      //regex containing object
      var re = require('matrix-app-config-helper').regex;
      if ( _.isObject(dataTypes[type])){
        // nested datatype structure
        _.each( dataTypes[type], function(f, key){

          // check that the data is formatted correctly
          if (
            (f.match(re.string) && _.isString(message[key])) ||
            (f.match(re.integer) && _.isInteger(message[key])) ||
            (f.match(re.float) && ( parseFloat( message[key] ) === message[key] )) ||
            ( f.match(re.boolean) && _.isBoolean(message[key]) )
          ){} else {
            error(key,'not formatted correctly\n', type, message)
          }
        })
        msgObj = message;
      } else {

        // not defined yet, TODO: enable this flow later
        var format = dataTypes[type];
        if ((format === 'string' && _.isString(message)) ||
          (format === 'float' && _.isFloat(message)) ||
          (format === 'int' && _.isInteger(message))) {
          msgObj.value = message;
        } else if (format === 'object' && _.isPlainObject(message)) {
          msgObj = message;
        } else {
          console.log('Type', type, 'data not correctly formatted.')
          console.log('Expecting:', format);
          console.log('Recieved:', message);
        }
      }
    }

  msgObj.time = Date.now();
  msgObj.type = type;
  process.send({
      type: 'app-emit',
      payload: msgObj
  });

}
