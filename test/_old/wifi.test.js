var exec = require('child_process').exec;
var expect = require('chai').expect;
//var WifiManager = require('pi-wifi');

describe('Wifi', function() {

     it('Should have the Wifi Service running', function(done) {
      exec("ps -fea | grep wpa_supplicant | grep -v grep", function(error, stdout, stderr, command) {
        expect(stdout.indexOf('wpa_supplicant')).to.be.above(-1);
        done();
      });
     });

    it.skip('Should be connected to a wifi network', function(done) {
       /*var wifiManager = new WifiManager();
       wifiManager.status(function(status){
         if(status.ssid && status.ip_address){
           done();
         }else{
           done(new Error("Not connected to a wifi network"));
         }
       });*/
     });


  /* //Useless when testing from a wifi network


    it('Should be able to connect to a network', function(done) {
       var wifiManager = new WifiManager();
       this.timeout(60000);
       wifiManager.disconnect();
       wifiManager.connect("0",function(){
          wifiManager.status(function(status){
             expect(status.ssid).to.be.exist();
             expect(status.ssid).to.be.ok();
             if(status.ssid && status.ip_address){
               done();
             }else{
               done(new Error("Unable to connect to a known network"));
             }
         })
       });
    });
    */
});
