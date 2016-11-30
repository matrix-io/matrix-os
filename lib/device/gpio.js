var debug = debugLog('gpio');

function dec2bin(dec) {
  return (dec >>> 0).toString(2);
}

var pinAmount = 17;

module.exports = {
  open: function (options) {
    // fetches the zero mq connections in a keyed object { config, update, ping... }
    var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers['gpio']);

    // put connections in options for component
    _.merge(options, mqs);

    var component = new Matrix.service.component(options);
    debug("OPTIONS:", options);
    debug("OPTIONS is called with pin:", options.pin);

    component.read(function (buffer) {
      debug('.read>', buffer);
      var binary = dec2bin(buffer.values);
      var pinArray = binary.split("").reverse();
      
      //Fill out the missing pins in the array
      /*for (var index = 0; index < pinAmount; pinAmount++){
        if (index >= pinArray.length) {
          pinArray[index] = 0;
        }
      }*/
      debug("RESULT: ", pinArray);

      // for pinAmount to apps on the other side of emit
      //data.type = options.name;
      // Forward back to the rest of the Application
      Matrix.events.emit('gpio-emit', { values: pinArray });
    });

    //component.write();

  },
  close: function (pin) {

  },
  write: function (pin, value) {
    console.log('GPIO Write Not Implemented Yet')
  }
}
