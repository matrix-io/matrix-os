var exec = require('child_process').exec;
var expect = require('chai').expect;

describe('Bluetooth', function() {

     it('Should have a bluetooth device', function(done) {
      exec("hcitool dev", function(error, stdout, stderr, command) {
        var result = stdout.trim().replace("Devices:","");
        expect(result.length).to.be.above(0);
        done();
      });
     });

   it('Should bluetooth interface be up', function(done) {
      exec("sudo hciconfig hci0", function(error, stdout, stderr, command) {
        if(stdout.indexOf("UP") > -1){
          done();
        }else{
          done(new Error('bluetooth interface is down'));
        }
      });
     });

   it('Bluetooth mac should match ethernet mac', function(done) {
    exec("hcitool dev", function(error, stdout, stderr, command) {
      var result = stdout.trim().replace("Devices:","");
      require('getmac').getMac(function(err,macAddress){
         if(result.toLowerCase().indexOf(macAddress.toLowerCase()) > -1){
            done();
         }else{
          done(new Error('MAC address and Bluetooth address are not the same'));
         }

        });
    });
   });

});
