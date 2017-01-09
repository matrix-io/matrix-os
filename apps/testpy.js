var spawn = require('child_process').spawn;

var p = spawn('python3' ,['matrix.py']);

p.stdout.on('data', function(data){
  console.log('py>', data.toString());
  // console.log('d>', JSON.parse(data));
})
p.stderr.on('data', function(data){
  console.error('ERROR:', data.toString());
})


// var i = setInterval( () => {
//   p.stdin.write(JSON.stringify({'poop':true})+ '\n');
// }, 1000);


p.stdin.write(JSON.stringify({event: 'app-start', value:'pyapp'})+ '\n');
var i = setInterval( () => {
  p.stdin.write(JSON.stringify({event: 'app-data', type:'temperature', value:1})+ '\n');
}, 1000);


setTimeout(()=>{
  clearInterval(i);
  p.stdin.end();
}, 5000)
