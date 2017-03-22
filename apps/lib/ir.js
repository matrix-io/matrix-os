var IR = {
  cmdResolve: null,
  brand: null,
  model: null,

  //TODO: support chaining methods or arrays
  /**
   * Does a lookup to see if the command is valid, if so, passes command to MOS.
   * Uses Promises to defer execution. 😎
   * @param {Object} options.brand - what maker ex. 'SONY' 
   * @param {Object} options.model - what device ex. '1337-D'
   */
  ir: function(options) {

    console.log('ir', options)

    IR.cmdPromise = new Promise(function(resolve, reject) {
      IR.cmdResolve = resolve;
    })

    if (options.hasOwnProperty('brand')) {
      debugger;
      IR.brand = options.brand.replace(/-./, '_').toLowerCase();
      IR.model = options.model.toUpperCase();
      var ext = '.lircd.conf';

      // https://storage.googleapis.com/assets.admobilize.com/lirc-remotes/sony/RM-AAU014.lircd.conf
      var url = ['https://storage.googleapis.com/assets.admobilize.com/lirc-remotes', IR.brand, IR.model + ext].join('/');
      // console.log(url);

      if (!IR.hasOwnProperty('cmds')) {
        require('https').get(url, function(res) {
          var status = res.statusCode;
          if (status !== 200) {
            console.error('Request Failed:', url, status);
          } else {
            var config = '';
            res.on('data', function(d) {
              config += d;
            })
            res.on('end', function() {

              // expose
              IR.config = config;
              var startI = config.indexOf('begin codes') + 11;
              var endI = config.indexOf('end codes');
              var codes = config.slice(startI, endI);
              IR.cmds = [];
              IR.codes = [];

              codes.split('\n').map(function(c) {
                //  BTN_VIDEO3               0x210C

                // clear empty lines
                if (_.isEmpty(c)) {
                  return;
                }
                // split code into word regions
                var re = /\w*/g;

                //strip empty space from array + first is cmd match
                IR.cmds.push(_.compact(c.match(re))[0]);
                IR.codes.push(_.compact(c.match(re))[1]);
              });
              IR.cmdResolve();
            });
          }
        })
      } else {
        IR.cmdResolve(IR.cmds);
      }
    }

    return IR;
  },
  send: function(cmd) {
    console.log('[m]>cmd', cmd);
    IR.cmdPromise.then(function() {
      if (IR.cmds.indexOf(cmd) > -1) {
        process.send({
          type: 'ir-cmd',
          cmd: 'send',
          payload: {
            brand: IR.brand,
            model: IR.model,
            config: IR.config
          }
        });

      } else {
        console.error(cmd, 'is not a valid command', cmds);
      }
    })
  }
}
console.log(IR);
module.exports = IR;