
// pin # = index
var pinHandlers = [];
var readPins = [];
var writePins = [];

module.exports = {
  read: function(pin, cb){
    if ( !_.isFunction(cb) ){
      throw new Error('matrix.gpio.read requires a callback');
    }

    readPins.push(pin);
    readPins = _.uniq(pin);
    pinHandlers[pin] = cb;

    process.send('gpio-open', pin);
    process.on('gpio-read', function(d){
      if ( d.pin === pin ){
        cb(d.value)
      }
    })
  },

  write: function( pin, value, cb ){
    process.send('gpio-write', { pin: pin, value: value });
    if ( _.isFunction(cb) ){
      cb();
    }
  }
}
