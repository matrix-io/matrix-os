// set nest api, little emitter in here too! 
var nest          = require('unofficial-nest-api');
var request       = matrix.request;
var say           = require('say');
var audio         = matrix.audio;
var microphone    = matrix.mic;
var EventEmitter  = require('events').EventEmitter;
var emitter       = new EventEmitter();

function stt(err, resp, body) {
    //stop the microphone from recording, while it's spitting out a result.
    console.log('checking wit api...');
    setTimeout(function(){
      microphone.stop();
      var store = JSON.parse(body);
      var text = store._text;
      console.log(store);

      if(typeof store.outcomes === 'object' && store.outcomes.length > 0) {
        if(store.outcomes[0].entities !== undefined) {
          if(typeof store.outcomes[0].entities.temperature === 'object') {
            emitter.emit('nest.temp', store.outcomes[0].entities.temperature[0].value);
          }
        }
      }

      matrix.notify('restart');
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
        say.speak('Alex','Setting the temperature to' + value);
        nest.setTemperature(nest.ftoc(value));
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

//start, stop, restart audo loop
matrix.on(function(message){
  if(message.payload === 'stop' || message.payload === 'start' || message.payload === 'restart') {
    console.log('listening...');
    microphone.start({ sampleRate: 48000 }).pipe(request.post({
      'url'     : 'https://api.wit.ai/speech?v=20141022&output=json',
      'headers' : {
        'Accept'        : 'application/vnd.wit.20160202+json',
        'Authorization' : 'Bearer ' + matrix.config.token,
        'Content-Type'  : 'audio/wav'
      }
    }, stt));
  }
});