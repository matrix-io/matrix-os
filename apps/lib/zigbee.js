// provides matrix.zigbee
//

var lightLookup;

function hueLookup(name){
  var tc = require('tinycolor2');
  var hue = tc(name).toHsv().h;
  return Math.round( hue * 360 );

}

module.exports = {
  light: function(id){
    return {
      light: this,
      color: function (hue) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'color-set', payload: { hue: hueLookup(hue) });
      },
      colorSpin: function (hue, time, direction) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'color-spin', payload: { hue: hueLookup(hue), time: time, direction: direction } });
      },
      colorMove: function (hue, time, direction) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'color-move', payload: { hue: hueLookup(hue), time: time, direction: direction } });
      },
      off: function () {
        process.send({ type: 'zigbee-light-cmd', cmd: 'off' });
      },
      on: function () {
        process.send({ type: 'zigbee-light-cmd', cmd: 'on' });
      },
      // saturation: function (level, time, direction) {
      //   process.send({ type: 'zigbee-light-cmd', cmd: 'saturation-move', payload: { saturation: level, time: time, direction: 0 } });
      // },
      fadeOn: function( time ){
        process.send({ type: 'zigbee-light-cmd', cmd: 'fade-on', payload: { time: time, direction: 0 } });
      },
      fadeOff: function( time )
        process.send({ type: 'zigbee-light-cmd', cmd: 'fade-off', payload: { time: time, direction: 1 } });
      },
      level: function (level, time, direction) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'level-move', payload: { saturation: level, time: time, direction: 0 } });
      },
    }
  }
}
