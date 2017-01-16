var proc = require('child_process');
var pwd = process.cwd();
    var dockerImages = proc.execSync("docker images | cut -d' ' -f1");
    console.log(dockerImages.toString());
    // check for image 'matrix-apphost' in docker images
    if ( dockerImages.toString().indexOf('matrix-apphost') === -1 ){
      // builds docker image for app hosting, see package.json
      try {
        var p = proc.execSync('docker build -t matrix-apphost -f Dockerfile-apphost .')

      } catch (e){
        console.error(e);
      }
      console.log('Built!');
    }
    // fire up docker image
    var name = 'clock';
    var p = proc.spawn('docker', ['run', '-v', pwd+'/apps:/apps', '-i', 'matrix-apphost', 'node','/apps/'+name+'.matrix/index.js']);

    p.stdout.on('data', function(d){
      console.log(d.toString());
    });

    p.stderr.on('data', (d) => { console.log(d.toString())});

    // console.log(p);
