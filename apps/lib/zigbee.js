// provides matrix.zigbee
//

function hueLookup(name) {
  if (_.isInteger(name)) {
    // map 360 to int32 0-360 -> 0-255
    return Math.round(name * (255 / 360));
  }

  var tc = require('tinycolor2');

  var hue = tc(name).toHsv().h;
  var rgb = tc(name).toRgb();
  if (rgb.r === rgb.b && rgb.g === rgb.b) {
    console.log('White or grey is not supported and will default to yellow');
    hue = tc('yellow').toHsv().h;
  }
  return Math.round(hue * (255 / 360));
}

// 0-100 -> 0-255
function levelConvert(level) {
  return Math.round(level * 2.55);
}

module.exports = {
  discover: function() {
    process.send({ type: 'zigbee-net-cmd', cmd: 'discover' });
  },

  reset: function() {
    process.send({ type: 'zigbee-net-cmd', cmd: 'reset' });
  },

  light: function() {
    return {
      color: function(hue, time) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'color-set', payload: { hue: hueLookup(hue), time: time } });
      },
      colorSpin: function(hue, time, direction) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'color-spin', payload: { hue: hueLookup(hue), time: time, direction: direction } });
      },
      colorMove: function(hue, time, direction) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'color-move', payload: { hue: hueLookup(hue), time: time, direction: direction } });
      },
      off: function() {
        process.send({ type: 'zigbee-light-cmd', cmd: 'off' });
      },
      on: function() {
        process.send({ type: 'zigbee-light-cmd', cmd: 'on' });
      },
      toggle: function() {
        process.send({ type: 'zigbee-light-cmd', cmd: 'toggle' })
      },
      // saturation: function (level, time, direction) {
      //   process.send({ type: 'zigbee-light-cmd', cmd: 'saturation-move', payload: { saturation: level, time: time, direction: 0 } });
      // },
      fadeIn: function(time) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'fade-on', payload: { time: time, direction: 0 } });
      },
      fadeOut: function(time) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'fade-off', payload: { time: time, direction: 1 } });
      },
      level: function(level, time, direction) {
        process.send({ type: 'zigbee-light-cmd', cmd: 'level-move', payload: { level: level, time: time, direction: 0 } });
      },
    }
  }
}