
// TODO: Investigate alternatives. OMXCTRL is mainly used for rpi.
var omx = require('omxctrl');
var spawn = require('child_process').spawn;

/*
 *@module MediaManager
 *@description media manager
 */
var MediaManager = {

  /*
  @method showImage
  @description Show an image at screen
  @author Julio Saldaña <Julio Saldaña>
  @param {String} imagePath
  @param {Number} duration
  @param {Function} callback
  */
  showImage: function(imagePath, duration, callback) {

    var options = ['-noverbose', '-norandom', '-a', '-T', '1', '-nocomments', '-1', '-t'];
    options.push(duration);
    options.push(imagePath);
    var child = spawn('fbi', options);

    child.stderr.once('data', function(stderr) {
      setTimeout(callback, (duration + 1) * 1000);
    });

  },


  /*
  @method showImageWithoutDuration
  @description Show an image at screen without duration
  @author by fabian hoyos <fabian hoyos>
  @param {String} imagePath
  */
  showImageWithoutDuration: function(imagePath) {

      var options = ['-noverbose', '-norandom', '-a', '-T', '1', '-nocomments', '-1'];
      options.push(imagePath);
      var child = spawn('fbi', options);
      child.stderr.once('data', function(stderr) {});

    },


    /*
    @method showSlideImages
    @description Show a list of images is slide
    @author Julio Saldaña <Julio Saldaña>
    @param {String} imageFolder
    @param {Number} interval
    @param {Function} callback
    */
    showSlideImages: showSlideImages,


    /*
    @method showVideo
    @description Show a video  at screen (and output audio)
    @author Julio Saldaña <julio.saldana@admobilize.com>
    @param {String} videoPath
    @param {Function} callback
    */
    showVideo: function(videoPath, callback) {

      //-o hdmi param sets hdmi as the current output
      //-b param sets a black background behind videos
      omx.play(videoPath, ["-o hdmi -b"]);
      omx.once('ended', function() {
        callback();
      });
    },


    /*
    @method killSplashProcesses
    @description Kills splash image processes
    @param {function} callback
    */
    killSplashProcesses: killSplashProcesses,


    /*
    @method showSplash
    @description Show splash image
    @author Julio Saldaña <julio.saldana@admobilize.com>
    */
    showSplash: function() {
      var splashFolder = Matrix.config.path.splash;
      console.info("MediaManager -- Preventive splash images removal");
      self.getSlideImagesProcesses(splashFolder, function(error, output, count) {
        if (!error) {
          if (count > 1) {
            self.resetSplashProcesses(function(error) {
              if (error) {
                console.error("MediaManager -- Error unable to reset splash images...");
              } else {
                console.info("MediaManager -- Restarting splash images process...");
              }
              return;
            });
          } else if (count == 1) {
            console.info("MediaManager -- Splash images already running");
          } else {
            console.info("MediaManager -- Initializing splash images process...");
            showSlideImages(splashFolder, Matrix.config.splashInterval);
          }
        }
      });
    },


    /*
    @method resetSplashProcesses
    @param {Function} callback
    @description Restarts the splash images slideshow
    */
    resetSplashProcesses: resetSplashProcesses,



    /*
    @method getSlideImagesProcesses
    @description Stop to display images
    */
    getSlideImagesProcesses: getSlideImagesProcesses,


    /*
    @method stopImageDisplay
    @description Stop to display images
    @author Julio Saldaña <Julio Saldaña>
    */
    stopImageDisplay: function() {

      Matrix.device.daemon.executeCommand("pkill fbi", function(error, stdout, stderr) {
          console.info("MediaManager -- stdout: ", stdout);
        }, null,
        function(child_process) {
          console.info("MediaManager -- Stop displaying image");
        });

    },


    /*
    @method getMediaWeight
    @param {String} url
    @param {Function} callback
    @description Stop to display images
    @author Julio Saldaña <Julio Saldaña>
    */
    getMediaWeight: function(url, callback) {
      var command = "wget " + url + " --spider --server-response -O - 2>&1 | sed -ne '/Content-Length/{s/.*: //;p}'";
      Matrix.device.daemon.executeCommand(command, function(stdout) {
        console.info("MediaManager -- media weight " + stdout);
        callback(parseInt(stdout, 10));
      }, null, function() {

      });
    }

}

module.exports = MediaManager;

function killSplashProcesses(callback) {
  var splashFolder = Matrix.config.path.splash;
  getSlideImagesProcesses(splashFolder, function(error, output, count) {
    if (!error) {
      if (count && count > 0) {
        console.info("MediaManager -- " + count + " splash images processes found");
        Matrix.device.daemon.killProcessList(output, function(error) {
          if (!error) {
            console.info("MediaManager -- " + count + " splash processes were killed");
          } else {
            console.error("MediaManager -- Error killing " + count + " splash images processes");
          }
          callback(error);
        });
      } else {
        console.info("MediaManager -- There are no splash processes to kill");
        callback(error);
      }
    } else {
      console.error("MediaManager -- Error killing splash images");
      console.error(error.stack);
      callback(error);
    }
  });
}

function showSlideImages(imageFolder, interval) {

  Matrix.device.daemon.executeCommand('fbi  -noverbose -norandom -a -T 1  -nocomments  -t ' + interval + " " + imageFolder + "/*",
    function(error, stdout, stderr) {
      console.info("MediaManager -- stdout: ", stdout);
    },
    function(stderr) {
      console.info("MediaManager -- stderr: ", stderr);
    },
    function(child_process) {
      console.info("MediaManager -- Show splash images");
    }
  );
}

function getSlideImagesProcesses(imageFolder, callback) {
  console.info("MediaManager -- Counting slide images processes in " + imageFolder);
  var output = "";
  var count = 0;
  if (imageFolder && imageFolder !== "") {
    var modifiedPath = "[" + imageFolder.charAt(0) + "]" + imageFolder.substring(1, imageFolder.length);
    var getSlidesCommand = "ps -eF | grep '" + modifiedPath + "' | awk '{print $2}'";
    Matrix.device.daemon.executeCommand(getSlidesCommand, function(stdout) {
      output += stdout;
    }, function(stderr) {}, function(command) {
      command.on('close', function(code) {
        var error;
        if (code === 0) {
          if (output && output !== "") {
            count += output.split("\n").length - 1;
          }
        } else {
          console.error("MediaManager -- Error (" + code + ") counting splash images process " + imageFolder);
          error = new Error("MediaManager -- Error (" + code + ") counting splash images process " + imageFolder);
        }
        callback(error, output, count);
      });
    });
  } else {
    callback(new Error("MediaManager -- Error counting splash images, imageFolder must be a path (" + imageFolder + ")"));
  }

}

function resetSplashProcesses(callback) {
  var splashFolder = path.splash;
  killSplashProcesses(function(error) {
    if (error) {
      console.info("MediaManager -- Error removing splash images...");
    } else {
      console.info("MediaManager -- Initializing splash images process...");
      self.showSlideImages(splashFolder, Matrix.config.splashInterval);
    }
  });
}

function killSplashProcesses(callback) {
  var splashFolder = path.splash;
  getSlideImagesProcesses(splashFolder, function(error, output, count) {
    if (!error) {
      if (count && count > 0) {
        console.info("MediaManager -- " + count + " splash images processes found");
        Matrix.device.daemon.killProcessList(output, function(error) {
          if (!error) {
            console.info("MediaManager -- " + count + " splash processes were killed");
          } else {
            console.error("MediaManager -- Error killing " + count + " splash images processes");
          }
          callback(error);
        });
      } else {
        console.info("MediaManager -- There are no splash processes to kill");
        callback(error);
      }
    } else {
      console.error("MediaManager -- Error killing splash images");
      console.error(error.stack);
      callback(error);
    }
  });
}
