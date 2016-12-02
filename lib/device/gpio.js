var debug = debugLog('gpio');

function dec2bin(dec) {
  return (dec >>> 0).toString(2);
}

var pinAmount = 17;

module.exports = {
  open: function (options) {
    //If gpio is already open, ignore
    if (Matrix.components.hasOwnProperty('gpio')) {
      return;
    }

    // fetches the zero mq connections in a keyed object { config, update, ping... }
    var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers['gpio']);

    // put connections in options for component
    _.merge(options, mqs);

    var component = new Matrix.service.component(options);

    component.read(function (buffer) {
      var binary = dec2bin(buffer.values);
      var pinArray = binary.split("").reverse();

      //Fill out the missing pins in the array
      /*for (var index = 0; index < pinAmount; pinAmount++){
        if (index >= pinArray.length) {
          pinArray[index] = 0;
        }
      }*/

      // for pinAmount to apps on the other side of emit
      //data.type = options.name;
      // Forward back to the rest of the Application
      Matrix.events.emit('gpio-emit', { type: 'read', values: pinArray });
    });

    //component.write();

  },
  close: function (pin) {

  },
  write: function (options) {
    console.log('GPIO WRITE: ', options);
    if ( Matrix.component.hasOwnProperty('gpio') && options.hasOwnProperty('pin') && options.hasOwnProperty('value')) {
      console.log('Found PIN# ', options.pin, ' with value assigned ', options.value);

      Matrix.component.gpio.send(options.pin, options.value, function (err, data) {
        if (err) console.log('WRITE ERROR:', err);

        Matrix.events.emit('gpio-emit', { type: 'write', pin: options.pin, value: options.value, data: data });
      });
    } else {
      console.error('Invalid Conditions for GPIO Write', options);
    }
  }
}
