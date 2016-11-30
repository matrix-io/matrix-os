
// pin # = index
var pinHandlers = [];
var readPins = [];
var writePins = [];

var listenerStarted = false;


module.exports = {
  read: function (pin, cb) {
    console.log("PIN TO READ:", pin);
    if (!_.isFunction(cb)) {
      throw new Error('matrix.gpio.read requires a callback');
    }

    readPins.push(pin);
    readPins = _.uniq(pin);
    pinHandlers[pin] = cb;

    process.send({
      type: 'gpio-open',
      pin: pin
    });

    if (!listenerStarted) {
      listenerStarted = true;
      process.on('message', function (message) {
        console.log("PIN MESSAGE: ", message); //NOT getting a pin in the message
        if (message.eventType == 'gpio-emit') {
          console.log("GPIO-EMIT");
          var resultPins = message.payload.values;

          readPins.forEach(function (element) {
            var value = 0;
            if (resultPins.length >= element) {
              value = resultPins[element - 1];
            }
            pinHandlers[element](value);
            console.log("#PIN: ", resultPins.length, '>', element, '? ... ', value);
          });
        }
        
        /*
        if (d.pin === pin) {
          cb(d.value)
        }
        */
      })
    }    
  },

  write: function (pin, value, cb) {
    console.log("PIN WRITE: ", pin, value);
    process.send('gpio-write', { pin: pin, value: value });
    if (_.isFunction(cb)) {
      cb();
    }
  },
  open: function () {
    
   },
  close: function () { }
}
