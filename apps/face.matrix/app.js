matrix.init('face').then(function (data) {
  console.log('detection>>>>', data);
  // if ( data.hasOwnProperty('x')){
  //   var angle = Math.atan2(data.x-0.5, data.y-0.5) * ( 180 / Math.PI);
  //   matrix.led({
  //     angle: angle-90,
  //     color: 'blue',
  //     blend: true
  //   });
  //   console.log('◃', angle+180);
  // }
  // matrix.led('blue').render();

  var i = 0;

  _.each(data.recognition, function (r) {
    if (r.tag === 'EMOTION') {
      if (r.emotion === 'CALM') {

        matrix.led([
          {
            angle: 45,
            color: matrix.color('green').spin(i),
            blend: true
          },
          {
            angle: 135,
            color: matrix.color('green').spin(-i)
          },
          {
            arc: 90,
            color: 'green',
            start: 225,
            blend: true
          }
        ]).render();

      } else if (r.emotion = 'ANGRY') {


        matrix.led([
          {
            angle: 45,
            color: matrix.color('red').spin(i),
            blend: true
          },
          {
            angle: 135,
            color: matrix.color('red').spin(-i)
          },
          {
            arc: 90,
            color: 'red',
            start: 225,
            blend: true
          }
        ]).render();

      } else if (r.emotion = 'HAPPY') {


        matrix.led([
          {
            angle: 45,
            color: matrix.color('yellow').spin(i),
            blend: true
                    },
          {
            angle: 135,
            color: matrix.color('yellow').spin(-i)
                    },
          {
            arc: 90,
            color: 'yellow',
            start: 225,
            blend: true
                    }
                  ]).render();

      } else if (r.emotion = 'SAD') {


        matrix.led([
          {
            angle: 45,
            color: matrix.color('blue').spin(i),
            blend: true
            },
          {
            angle: 135,
            color: matrix.color('blue').spin(-i)
            },
          {
            arc: 90,
            color: 'blue',
            start: 225,
            blend: true
            }
          ]).render();

      } else if (r.emotion = 'DISGUST') {
        matrix.led([
          {
            angle: 45,
            color: matrix.color('bada55').spin(i),
            blend: true
          },
          {
            angle: 135,
            color: matrix.color('bada55').spin(-i)
          },
          {
            arc: 90,
            color: 'bada55',
            start: 225,
            blend: true
          }
        ]).render();
      }
    }
  })

});
