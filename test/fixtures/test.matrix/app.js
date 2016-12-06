// // typed send
// matrix.type('testType').send({ foo: 1 })
//
// // default typed send
// matrix.send({foo:2})
//
// //send global message
// matrix.emit('foo')
//
// //send app specific message
// matrix.emit('otherapp', 'otherfoo')
//
// //send namespaced message
// matrix.emit('otherapp','nameofevent', 'namedfoo')


matrix = require('../../../apps/matrix.js');

var c = JSON.parse( require('fs').readFileSync( __dirname + '/config.json'));
matrix.startApp('test', c);

process.on('message', function(msg){
  if (!msg.hasOwnProperty('test')){
    return console.error('no test passed to faketrix');
  }
  switch ( msg.test ) {
    case 'led':
      matrix.led('red').render();
      break;
    case 'face':
      matrix.init('face');
      break;
    case 'demographics':
      matrix.init('demographics');
      break;
    case 'vehicle':
      matrix.init('vehicle');
      break;
    case 'palm':
      matrix.init('palm');
      break;
    case 'pinch':
      matrix.init('pinch');
      break;
    case 'fist':
      matrix.init('fist');
      break;
    case 'thumb-up':
      matrix.init('thumb-up');
      break;
    case 'temperature':
      matrix.init('temperature');
      break;
    case 'altitude':
      matrix.init('altitude');
      break;
    case 'humidity':
      matrix.init('humidity');
      break;
    case 'gyroscope':
      matrix.init('gyroscope');
      break;
    case 'accellerometer':
      matrix.init('accellerometer');
      break;
    case 'nfc':
      matrix.init('nfc');
      break;
    case 'pressure':
      matrix.init('pressure');
      break;
    case 'uv':
      matrix.init('uv');
      break;
    case 'mic':
      matrix.init('mic');
      break;
    case 'ir':
      matrix.init('ir');
      break;
    case 'send':
      matrix.type('test').send({ foo: 1 });
      break;
    case 'talk':
      // //send global message
      matrix.emit('foo');
      //
      // //send app specific message
      matrix.emit('otherapp', 'otherfoo');
      //
      // //send namespaced message
      matrix.emit('otherapp','nameofevent', 'namedfoo');
      break;
    default:
      break;
  }
});
