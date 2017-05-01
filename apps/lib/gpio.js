
// pin # = index
var pinHandlers = []; //Callback for each pin
var pinWriteHandlers = []; //Callback for each pin write
var readPins = []; //Pins that are being notified
var writePins = [];

var listenerStarted = false;

function setListener() {
  if (!listenerStarted) { //Only start listening once
    listenerStarted = true;
    process.on('message', function (message) {
      if (message.eventType == 'gpio-emit') {

        if (message.payload.type == 'read') {
          var resultPins = message.payload.values;
          readPins.forEach(function (element) {
            var value = 0;
            if (resultPins.hasOwnProperty(element)) { //Only assign a value to that pin if a value is specified
              value = resultPins[element];
            }
            pinHandlers[element](value);
          });

        } else if (message.payload.type == 'write') {
          console.log('WRITE LISTENER!:', message);
          /*var resultPins = message.payload.values;
          readPins.forEach(function (element) {
            var value = 0;
            if (resultPins.hasOwnProperty(element)) { //Only assign a value to that pin if a value is specified
              value = resultPins[element];
            }
            pinHandlers[element](value);
          });
          */
          //pinWriteHandlers[element];
        }
      }
    })
  };
};

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

    setListener();
  },

  write: function (pin, value, cb) {
    console.log("PIN WRITE: ", pin, value);
    pinWriteHandlers[pin] = cb;
    process.send({
      type: 'gpio-write',
      pin: pin,
      value: value
    });
    //process.send('gpio-write', { pin: pin, value: value });
    setListener();
  },
  servo: function(pin, angle){
    process.send({
      type: 'gpio-write',
      servo: true,
      pin: pin,
      value: angle
    });
  },
  open: function () {

   },
  close: function () { }
}
