
var depth = 40;
var _ = require('lodash')
var stage = [];

//seed
_.each(Array(depth), function(s, i){
  if (Math.random() > 0.5){
    stage[i] = 'x'
  } else {
    stage[i] = ' '
  }
})

console.log(stage.join(''));
var last = stage;
setInterval(function(){
  var start = stage;
  if ( _.has(start, '-1')){
    stage[start.length] = start[-1];
  }
  _.each(start, function(s, i){
    //dead
    if ( s === ' ' ){
      if ( start[i-1] === 'x' && start[i+1] === 'x' ){
        // make alive
        stage[i] = 'x';
        stage[i+1] = ' ';
        stage[i-1] = ' ';
      }
      //spontaneous generation
      // if ( start[i-1] === ' ' && start[i+1] === ' ' ){
      //   // make alive
      //   stage[i] = 'x';
      // }
    }
    // alive
    if ( s === 'x'){
      //no neighbors
      if ( start[i-1] === ' ' && start[i+1] === ' '){
        //stay
        stage[i] = 'x';
      }
      //one neighbor
      if ( start[i-1] === 'x' || start[i+1] === 'x'){
        //travel
        if ( start[i-1] === 'x' ){
          stage[i+1] = 'x';
          stage[i-1] = ' ';
        } else {
          stage[i-1] = 'x'
          stage[i+1] = ' '
        }
      }
      // two neighbors
      if ( start[i-1] === 'x' && start[i+1] === 'x'){
        stage[i] = ' ';
      }
    }
  })
  last = stage;
  console.log(stage.join(''));
}, 100)
