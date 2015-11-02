matrix.init('camera', {
      'height': 640,
      'width': 480,
      'minSize': 20,
      'maxSize': 400,
      'drawObjects': true,
      'show': false,
      'save': false,
      //'output':'/home/julio/photos',
      'processUniques': false,
      "detection": {
        type: "humans",
        detector: 3
      },
      "directory": "/Volumes/Synapse/Projects/_client/r3r/admob/admobilize-detection/data/"})
        .then(function(err, data) {
          console.log(err);
          if (err) console.error(err);
          if (data === false || typeof data === 'undefined') {
            console.error('no match on filter'.red);
          } else {
            matrix.send({
              'type': 'test',
              data: data
            });


            //test specific app + event
            // matrix.notify('test-event','doTest', data);

            //test specific app
            // matrix.notify('test-event', {global: false});

            //test global
            //matrix.notify({global:true});
          }
        });
