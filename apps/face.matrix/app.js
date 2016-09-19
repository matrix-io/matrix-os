matrix.init('face').then(function (data) {
  console.log('face!', data);

  _.each(data.recognition, function (r) {

    if (r.tag === 'HEAD_POSE'){
      matrix.led([
        {angle: Math.round( r.pose_roll * 360 ),
        color:'orange' }
      ]).render();
    }

    // filter by emotion module output
    if (r.tag === 'EMOTION') {

      // calm face
      if (r.emotion === 'CALM') {

        matrix.led([
          {
            angle: 45,
            color: matrix.color('lightblue'),
            blend: true
          },
          {
            angle: 135,
            color: matrix.color('lightblue'),
          },
          {
            arc: 90,
            color: 'lightblue',
            start: 225,
            blend: true
          }
        ]).render();

      } else if (r.emotion = 'ANGRY') {


        matrix.led([
          {
            angle: 45,
            color: matrix.color('red'),
            blend: true
          },
          {
            angle: 135,
            color: matrix.color('red')
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
            color: matrix.color('yellow'),
            blend: true
                    },
          {
            angle: 135,
            color: matrix.color('yellow')
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
            color: matrix.color('blue'),
            blend: true
            },
          {
            angle: 135,
            color: matrix.color('blue')
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
            color: matrix.color('bada55'),
            blend: true
          },
          {
            angle: 135,
            color: matrix.color('bada55')
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
