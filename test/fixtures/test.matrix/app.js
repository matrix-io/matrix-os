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


matrix = require('../matrix.js');

var c = JSON.parse(require('fs').readFileSync(__dirname + '/config.json'));
// matrix.startApp('test', c);

process.on('message', function(msg) {
  if (!msg.hasOwnProperty('test')) {
    return console.error('no test passed to faketrix');
  }
  switch (msg.test) {
    case 'led':
      matrix.led('red').render();
      break;
    case 'face':
      matrix.service('face').start();
      break;
    case 'recog-start':
      matrix.service('recognition').start();
      break;
    case 'recog-train':
      matrix.service('recognition').train('test');
      break;
    case 'recog-untrain':
      matrix.service('recognition').untrain('test');
      break;
    case 'recog-stop':
      matrix.service('recognition').stop();
      break;
    case 'demographics':
      matrix.service('demographics').start();
      break;
    case 'vehicle':
      matrix.service('vehicle').start();
      break;
    case 'palm':
      matrix.service('palm').start();
      break;
    case 'pinch':
      matrix.service('pinch').start();
      break;
    case 'fist':
      matrix.service('fist').start();
      break;
    case 'thumb-up':
      matrix.service('thumb-up').start();
      break;
    case 'temperature':
      matrix.sensor('temperature');
      break;
    case 'altitude':
      matrix.sensor('altitude');
      break;
    case 'humidity':
      matrix.sensor('humidity');
      break;
    case 'gyroscope':
      matrix.sensor('gyroscope');
      break;
    case 'accellerometer':
      matrix.sensor('accellerometer');
      break;
    case 'nfc':
      matrix.sensor('nfc');
      break;
    case 'pressure':
      matrix.sensor('pressure');
      break;
    case 'uv':
      matrix.sensor('uv');
      break;
    case 'ir':
      matrix.sensor('ir');
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
      matrix.emit('otherapp', 'nameofevent', 'namedfoo');
      break;
    case 'crash':
      throw new Error('this is not a real error');
    default:
      break;
  }
});