// app code goes here
// matrix.init()....
//
// have fun

//first thing first

//set colors
/*
setInterval(function() {
  matrix.led('blue').render();
}, 1000);

//interleave two colors
setInterval(function() {
  matrix.led(['#bada55', '#e1ee7e']).render();
}, 1000);

setInterval(function() {
  matrix.led(['blue', 'red']).render();
}, 1000);


//support opacity
setInterval(function() {
  matrix.led('rgba(255, 0, 100, 0.6)').render();
}, 1000);


setInterval(function() {
  matrix.led('rgba(255, 255, 0, 1)').render();
}, 1000);

//generate shapes
setInterval(function() {
  matrix.led({
    //degress of arc
    arc: 90,

    color: 'green',

    //index to start drawing arc
    start:12
  }).render();
}, 1000);


setInterval(function() {
  matrix.led({
    //degress of arc
    arc: 180,

    color: 'blue',

    //index to start drawing arc
    start:12
  }).render();
}, 1000);


//no color assumes off
setInterval(function() {
  matrix.led({ arc: 360 }).render();
}, 1000);

//no color assumes off
setInterval(function() {
  matrix.led({ color: 'red', arc: 200 }).render();
}, 1000);


//draw a point
setInterval(function() {
  matrix.led({
    angle: 245,
    color: 'white',
    // blends interlight space if true, solid lights if false, default false
    blend: true
  }).render();
}, 1000);


//draw a point
setInterval(function() {
  matrix.led({
    angle: 245,
    color: 'green',
    // blends interlight space if true, solid lights if false, default false
    blend: false
  }).render();
}, 1000);


//manipulate position
//rotate the lights clockwise by a specified angle
setInterval(function() {
  matrix.led().rotate(90).render();
}, 1000);


setInterval(function() {
  matrix.led({ color: '#d3d3d3'}).rotate(180).render();
}, 1000);


setInterval(function() {
  matrix.led({ color: '#4b0082'}).rotate(270).render();
}, 1000);


setInterval(function() {
  matrix.led({ color: 'blue'}).rotate(360).render();
}, 1000);


//shape objects
//make a smiley face
setInterval(function() {
  matrix.led([
    {
      angle: 45,
      color: 'yellow'
    },
    {
      angle: 135,
      color: 'yellow'
    },
    {
      arc: 90,
      color: 'yellow',
      start: 225
    }
  ]).render();
}, 1000);

*/
//direct pixel manipulation
//(0) -> 0, (1) -> 0, (2) -> 0, (3) -> 0, (4) -> yellow, (5) -> 0, (6) -> 0
//(7) -> 0, (8) -> 0, (9) -> 0, (10) -> 0, (11) -> 0, (12) -> 0, (13) -> yellow,
//(14) -> 0, (15) -> 0, (16) -> 0, (17) -> 0, (18) -> 0, (19) -> 0, (20) -> 0, (21) -> 0,
//(22) -> yellow,  (23) -> yellow, (24) -> yellow, (25) -> yellow, (26) -> yellow, (27) -> yellow,
//(28) -> yellow, (29) -> yellow, (30) -> yellow, (31) -> yellow, (32) -> yellow, (33) -> yellow,
//(34) -> yellow, (35) -> yellow
setInterval(function() {

  matrix.led(['purple', 0, 0, 0, 'blue', 0,
    0, 0, 0, 0, 0, 0, 0, 'blue', 0, 0,
    0, 0, 0, 0, 0, 0, 'blue', 'blue',
    'blue', 'blue', 'green', 'white',
    'red', 'red', 'blue', 'blue', 'blue',
    'blue', 'blue', 'blue']).render();

}, 1000);

/*
//example clock

setInterval(function(){
  var time = new Date();
  var h = time.getHours();
  var m = time.getMinutes();
  var s = time.getSeconds();

  var hourLed = {
    // translate hours (12) to angle (360)
    arc: h * 3,
    color: 'blue',
    darken: 50
  };

  var minuteLed = {
    //translate minutes (60) to angle (360)
    angle: m * 6,
    color: 'green'
  };

  var secondLed = {
    //translate seconds (60) to angle (360)
    angle: s * 6,
    color: 'yellow',
    blend: true
  };
  matrix.type('clock').send({
    'hourAngle': hourLed.arc,
    'minuteAngle': minuteLed.angle,
    'secondAngle': secondLed.angle
  });

  matrix.led([hourLed, minuteLed]).render();
}, 1000);*/
