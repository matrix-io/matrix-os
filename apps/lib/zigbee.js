// provides matrix.zigbee
//

var lightLookup;

function hueLookup(name){
  if ( _.isInteger( name ) ) {
    return name;
  }
  var tc = require('tinycolor2');
  var hue = tc(name).toHsv().h;
  return Math.round( hue * 360 );

}

module.exports = {
  discover: function(){
    process.send({ type: 'zigbee-net-cmd', cmd: 'discover'});
  },

  reset: function(){
    process.send({ type: 'zigbee-net-cmd', cmd: 'reset'});
  },

  light: function(){
    return {
      color: function (hue, time) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'color-set', payload: { hue: hueLookup(hue), time: time } });
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
      toggle: function(){
        process.send({ type:'zigbee-light-cmd', cmd:'toggle'})
      },
      // saturation: function (level, time, direction) {
      //   process.send({ type: 'zigbee-light-cmd', cmd: 'saturation-move', payload: { saturation: level, time: time, direction: 0 } });
      // },
      fadeOn: function( time ){
        process.send({ type: 'zigbee-light-cmd', cmd: 'fade-on', payload: { time: time, direction: 0 } });
      },
      fadeOff: function( time ){
        process.send({ type: 'zigbee-light-cmd', cmd: 'fade-off', payload: { time: time, direction: 1 } });
      },
      level: function (level, time, direction) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'level-move', payload: { saturation: level, time: time, direction: 0 } });
      },
    }
  }
}
