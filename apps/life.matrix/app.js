
var depth = 40;
var _ = require('lodash')
var stage = _.times(depth-1, _.constant(0));
stage.push(1);

//seed
// _.each(Array(depth), function(s, i){
//   if (Math.random() > 0.9){
//     stage[i] = 1
//   } else {
//     stage[i] = 0
//   }
// })

// console.log(stage.join(''));

function rule110(input){
  var rule = [0,1,1,0,1,1,1,0];
  // console.log(input, rule[input]);
  return rule[input];
}


function rule90(input){
  var rule = [0,1,0,1,1,0,1,0];
  // console.log(input, rule[input]);
  return rule[input];
}


setInterval(function(){



  var start = stage;
  start[-1] = 0;
  start[start.length] = 1;
  _.each(start, function(c, i){
    if ( i === 0 || i === start.length -1 ){
      stage[i] = 1;
    } else {
      stage[i] = rule90(parseInt([start[i-1],c, start[i+1]].join(''), 2));
    }
  })
  // console.log(_.take(stage, depth).join(''));

  // console.log(stage.join(''));
  var colors = _.map(stage,function(b){
    if (b === 1){
      return '#0000FF'
    } else {
      return '#000001'
    }
  });

  matrix.led( _.take(colors, depth) ).render();
}, 100);
