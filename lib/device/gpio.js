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

      Matrix.events.emit('gpio-emit', { type: 'read', values: pinArray });
    });

    //component.write();

  },
  close: function (pin) {

  },
  write: function (options) {
    if ( !Matrix.components.hasOwnProperty('gpio')){
      // fetches the zero mq connections in a keyed object { config, update, ping... }

      // fakes a servo component using gpio driver, but a different port
      if (options.servo === true){

        var gpioBase = _.clone(Matrix.device.drivers['gpio']);
        gpioBase.name = 'servo';
        // uses new port
        var mqs = Matrix.service.zeromq.registerComponent(gpioBase);

        // put connections in options for component
        _.merge(options, mqs);

        // makes Matrix.component.servo with gpio driver
        var component = new Matrix.service.component(options, Matrix.device.drivers['gpio']);

        // remove 0mq from options
        options = _.pick(options, ['pin', 'servo', 'value']);

      } else {

        //gpio
        var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers['gpio']);

        // put connections in options for component
        _.merge(options, mqs);

        var component = new Matrix.service.component(options);
        options = _.pick(options, ['pin', 'value']);

      }


    }

    if ( options.servo === true && Matrix.components.hasOwnProperty('servo') && options.hasOwnProperty('pin') && options.hasOwnProperty('value')){
      Matrix.components.servo.send(options);
    } else if ( Matrix.components.hasOwnProperty('gpio') && options.hasOwnProperty('pin') && options.hasOwnProperty('value')) {
      Matrix.components.gpio.send(options);
    } else {
      console.error('Invalid Conditions for GPIO Write', options);
    }
  }
}
