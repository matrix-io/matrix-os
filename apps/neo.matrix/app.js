
var mic       = matrix.init('mic');
var audio     = matrix.audio;
var controls  = matrix.controls; //connect to channel for user
var file      = matrix.file;

//if file does not exist, throw false
var name = file.load('name.txt');

//check if name is not empty
if(name) {
  //if name is not empty, then listen for speech to text, 
  //and output when "name" is heard
  mic.listen(name).then(function(err, out){
      if(err) throw err;
      matrix.notify(out);
      //message out on matrix, some sort of namespace for each app
  });
} else {

  //say that it needs a name
  audio.say('Please log into your mobile application and give me a name');

  //wait for the name to be entered
  controls.on('text.message', function(err, name){
    if(err) throw err;
    file.save('name.txt', name);

    //mic.listen == convert speech to text
    mic.listen(name).then(function(err, out){
      //some sort of namespace for each app
      matrix.notify(out);
    });
  });
}

//listen for events coming in
matrix.on('neo.say',function(err, message){
    audio.say(message);
});