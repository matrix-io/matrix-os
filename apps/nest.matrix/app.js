// set nest api, little emitter in here too!
var nest          = require('unofficial-nest-api');
var request       = matrix.request;
var say           = require('say');
var audio         = matrix.audio;
var microphone    = matrix.mic;
var EventEmitter  = require('events').EventEmitter;
var emitter       = new EventEmitter();

function august(value) {
  'use strict';

  var augustctl   = require('./node_modules/augustctl/index');

  // console.log('work motherfucker...');

  var config = { "offlineKey": "474139B674B6A4AB324237FCD9AEEA2D", "offlineKeyOffset": 1 };
  var op = value;
  if (typeof augustctl.Lock.prototype[op] !== 'function') {
    throw new Error('invalid operation: ' + op);
  }


  augustctl.scan(config.lockUuid).then(function(peripheral) {
    console.log('scanning...', peripheral);
    var lock = new augustctl.Lock(
      peripheral,
      config.offlineKey,
      config.offlineKeyOffset
    );
    lock.connect().then(function() {
      console.log('connecting, and running lock function...', op);
      return lock[op]();
    }).catch(function(e) {
      console.log(e.toString());
      //matrix.notify('restart');
    }).finally(function() {
      console.log('finally');
      return lock.disconnect().finally(function() {
        // console.log('disconnect');
        augustctl = {};
        matrix.notify('restart');
      });
    });
  });

  //log in and set the temperature
}

function stt(err, resp, body) {
    //stop the microphone from recording, while it's spitting out a result.

    if(err) {
      matrix.notify('restart');
    }

    setTimeout(function(){
      microphone.stop();
      var store = JSON.parse(body);
      var text = store._text;
      // console.log(store);

      if(text === undefined) {
        matrix.notify('restart');
      }

      var r1 = /^(unlock|open)/;
      var r2 = /^(lock|close)/;

      if(r1.test(text)) {
        console.log('unlocking the door...');
        emitter.emit('august.lock', 'unlock');
      } else if(r2.test(text)) {
        console.log('locking the door...');
        emitter.emit('august.lock', 'lock');
      }

      if(typeof store.outcomes === 'object' && store.outcomes.length > 0) {
        if(store.outcomes[0].entities !== undefined) {
          if(typeof store.outcomes[0].entities.temperature === 'object') {
            emitter.emit('nest.temp', store.outcomes[0].entities.temperature[0].value);
          } else {
            matrix.notify('restart');
          }
        } else {
          matrix.notify('restart');
        }
      } else {
        matrix.notify('restart');
      }


    },1000);

}

function nesty(value) {
  //log in and set the temperature
  nest.login(matrix.config.username, matrix.config.password, function (err, data) {
      if (err) {
          console.log(err.message);
          process.exit(1);
          return;
      }

      //always need to fetch status
      nest.fetchStatus(function (data) {
        console.log(data);
        say.speak('Alex','Setting the temperature to' + value);
        nest.setTemperature('09AA01AC281513MY', nest.ftoc(value));
        matrix.notify('restart');
      });
  });
}

matrix.notify('start');
console.log('starting nest app...');

//emitter events
emitter.on('nest.temp', function(msg){
  console.log('set the temperature :D');
  nesty(msg);
});

emitter.on('august.lock', function(msg){
  if(msg === 'unlock') {
    say.speak('Alex','Welcome Brian');
    exec('AUGUSTCTL_CONFIG=~/admobilize/admatrix/apps/nest.matrix/config.json augustctl unlock',function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
          console.log('exec error: ' + error);
        }
    });
    matrix.notify('restart');
  } else {
    say.speak('Alex','Goodbye Brian, have a good day.');
        exec('AUGUSTCTL_CONFIG=~/admobilize/admatrix/apps/nest.matrix/config.json augustctl lock',function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
          console.log('exec error: ' + error);
        }
    });
    matrix.notify('restart');
  }
  august(msg);
});

// emitter.emit('august.lock', 'lock');

//start, stop, restart audo loop
matrix.on(function(message){
  if(message.payload === 'stop' || message.payload === 'start' || message.payload === 'restart') {
    console.log('listening...');
    microphone.start({ sampleRate: 48000 }).pipe(request.post({
      'url'     : 'https://api.wit.ai/speech?v=20141022&output=json',
      'headers' : {
        'Authorization' : 'Bearer ' + matrix.config.token,
        'Content-Type'  : 'audio/wav'
      }
    }, stt));
  }
});
