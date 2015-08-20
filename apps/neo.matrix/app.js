var mic = matrix.init('mic');
var audio = matrix.init('audio');
var controls = matrix.init('controls');
var file = matrix.file;

//if file does not exist, throw false
var name = file.load('name.txt');

//check if name is empty
if(name) {
  mic.listen(name).then(function(err, out){
      matrix.notify(out);
      //some sort of namespace for each app
  });
} else {
  
  //say that it needs a name
  audio.say('Please log into your mobile application and give me a name');

  //wait for the name to be entered
  controls.on('text.message', function(err, name){
    file.save('name.txt', name);
    mic.listen(name).then(function(err, out){
      //some sort of namespace for each app
      matrix.notify(out);
    });
  });
}

//events coming in
matrix.on('neo.say',function(err, out){
    audio.say(out);
});