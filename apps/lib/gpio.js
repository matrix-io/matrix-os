
// pin # = index
var pinHandlers = []; //Callback for each pin 
var readPins = []; //Pins that are being notified
var writePins = [];

var listenerStarted = false;


module.exports = {
  read: function (pin, cb) {
    if (!_.isFunction(cb)) {
      throw new Error('matrix.gpio.read requires a callback');
    }
    
    readPins.push(pin);
    readPins = _.uniq(readPins);
    pinHandlers[pin] = cb;

    process.send({
      type: 'gpio-open',
      pin: pin
    });

    if (!listenerStarted) { //Only start listening once
      listenerStarted = true;
      process.on('message', function (message) {
        if (message.eventType == 'gpio-emit') {
          var resultPins = message.payload.values;
          readPins.forEach(function (element) {
            var value = 0;
            if (resultPins.hasOwnProperty(element)) { //Only assign a value to that pin if a value is specified 
              value = resultPins[element];
            }
            pinHandlers[element](value);
          });
        }
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
