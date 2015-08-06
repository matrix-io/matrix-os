var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var psTree = require('ps-tree');

/*
 *@module DaemonManager
 *@description Deamon manager
 */
var DaemonManager = {

  executeCommand: executeCommand,


  /*
   *@method spawnCommand
   *@param {String} command
   *@param {Function} onStdout
   *@param {Function} onStderr
   *@description Start a new child process
   */
  spawnCommand: function(command, options, onStdout, onStderr, callback) {
    var child = spawn(command, options);
    child.stdout.on('data', onStdout);
    child.stderr.on('data', onStderr);
    callback(child);
  },


  hardKillProcess: function(pid) {
    var options = [pid];
    options.push('-9');
    spawn('kill', options);
  },

  /*
  @method killProcessList
  @description Kills the processes with pid's supplied
  @param {String} processList String containing pid's separated by spaces
  */
  killProcessList: function(processList, callback) {
    console.info("DaemonManager -- Killing processes " + processList);
    if (processList && processList !== "") {
      var killSlidesCommand = "kill -9 " + processList;
      executeCommand(killSlidesCommand, function() {}, function(stderr) {},
        function(command) {
          command.on('close', function(code) {
            var error;
            if (code === 0) {
              console.info("DaemonManager -- Processes were killed successfully");
            } else {
              error = new Error("DaemonManager -- Error (" + code + ") killing processes " + processList);
            }
            callback(error);
          });
        }
      );
    } else {
      callback(new Error("DaemonManager -- Process list is empty"));
    }

  },

  kill: kill

}


function executeCommand(command, onStdout, onStderr, callback) {

  var child = exec(command);
  child.stdout.on('data', onStdout);

  if (onStderr) {
    child.stderr.on('data', onStderr);
  }

  callback(child);
}
/*
   function from https://github.com/nodejitsu/forever-monitor/ to kill a child_process
   */
function kill(pid, signal, callback) {
  signal = signal || 'SIGKILL';
  callback = callback || function() {};
  var killTree = true;
  if (killTree) {
    psTree(pid, function(err, children) {
      [pid].concat(
        children.map(function(p) {
          return p.PID;
        })
      ).forEach(function(tpid) {
        try {
          process.kill(tpid, signal)
        } catch (ex) {}
      });
      callback();
    });
  } else {
    try {
      process.kill(pid, signal)
    } catch (ex) {}
    callback();
  }
}

module.exports = DaemonManager;
