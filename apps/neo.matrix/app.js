
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
    microphone.stop();
    var store = JSON.parse(body);
    var text = store._text;

    if(text !== null) {
      if(text.indexOf("stop") != -1 ) {
        for(j = 0; j < trackPlayers.length; j++ ) {
          trackPlayers[j].stop();
        }
        matrix.notify('restart');
      } else if(text.indexOf("do it") != -1 ) {
        trackPlayers[i] = audio.play('shia-labeouf.mp3',25);
        matrix.send({ 'type': 'neo', data: { 'plays': 1, 'message': text } });
        matrix.notify('restart');
        i++;
      } else {
        matrix.send({ 'type': 'neo', data: { 'interprets': 1, 'message': text } });
        matrix.notify('restart');
      }
    } else {
      matrix.notify('stop');
    }

};

matrix.on(function(message){
  if(message.payload === 'stop' || message.payload === 'start' || message.payload === 'restart') {
    microphone.start().pipe(request.post({
      'url'     : 'https://api.wit.ai/speech?v=20141022&output=json',
      'headers' : {
        'Accept'        : 'application/vnd.wit.20160202+json',
        'Authorization' : 'Bearer ' + witToken,
        'Content-Type'  : 'audio/wav'
      }
    }, exports.parseResult));
  }
});

// //if file does not exist, throw false
// var name = file.load('name.txt');

// //check if name is not empty
// if(name) {
//   //if name is not empty, then listen for speech to text, 
//   //and output when "name" is heard
//   microphone.record.on('data', function(data) {
//       if(err) throw err;

//       matrix.notify(out);
//       //message out on matrix, some sort of namespace for each app
//   });

//   microphone.info.on('data', function(data){
//       process.stdout.write(data);
//   });
// } else {

//   //say that it needs a name
//   audio.say('Please log into your mobile application and give me a name');

//   //wait for the name to be entered
//   controls.on('text.message', function(err, name){
//     if(err) throw err;
//     file.save('name.txt', name);

//     //mic.listen == convert speech to text
//     mic.listen(name).then(function(err, out){
//       //some sort of namespace for each app
//       matrix.notify(out);
//     });
//   });
// }

// //listen for events coming in
// matrix.on('neo.say',function(err, message){
//     audio.say(message);
// });