
var microphone    = matrix.mic;
var audio         = matrix.audio;
var trackPlayers  = [];
var i             = 0;
var request       = matrix.request;
var witToken      = 'E6VKUM55E4YCNMF2T4H7A2CUTU6OD4BE'; // get one from wit.ai!

// kick off recording
matrix.notify('start');

exports.parseResult = function (err, resp, body) {
    
    //stop the microphone from recording
    setTimeout(function(){
      microphone.stop();
      var store = JSON.parse(body);
      var text = store._text;
      if(text != null && text != "undefined") {
        if(text.indexOf("stop") != -1 ) {
          for(j = 0; j < trackPlayers.length; j++ ) {
            trackPlayers[j].stop();
          }
          matrix.notify('restart');
        } else if(text.indexOf("do it") != -1 ) {
          trackPlayers[i] = audio.play('shia-labeouf.mp3',25);
          matrix.send({ 'type': 'neo', data: { 'engagements': 1, 'message': text } });
          matrix.notify('restart');
          i++;
        } else {
          matrix.send({ 'type': 'neo', data: { 'listens': 1, 'message': text } });
          matrix.notify('restart');
        }
      } else {
        matrix.notify('stop');
      }
    },1000);
    
};

matrix.on(function(message){
  if(message.payload === 'stop' || message.payload === 'start' || message.payload === 'restart') {
    microphone.start({ sampleRate: 48000 }).pipe(request.post({
      'url'     : 'https://api.wit.ai/speech?v=20141022&output=json',
      'headers' : {
        'Accept'        : 'application/vnd.wit.20160202+json',
        'Authorization' : 'Bearer ' + witToken,
        'Content-Type'  : 'audio/wav'
      }
    }, exports.parseResult));
  }
});