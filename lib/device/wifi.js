/* @see https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md */

// sudo iwlist wlan0 scan
//
//

//
// sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
//
// Go to the bottom of the file and add the following:
//
// network={
//     ssid="The_ESSID_from_earlier"
//     psk="Your_wifi_password"
// } jaime and raymond

// sudo ifdown wlan0 and  sudo ifup wlan0, or reboot your Raspberry Pi with sudo reboot.

// You can verify if it has successfully connected using ifconfig wlan0. If the  inet addr field has an address beside it, the Pi has connected to the network. If not, check your password and ESSID are correct.

var commands = {
  scan: 'sudo iwlist wlan0 scan | grep ESSID | cut \'"\' -f2',
  wpaFile: 'sudo cat /etc/wpa_supplicant/wpa_supplicant.conf',
  restart: 'sudo ifdown wlan0; sudo ifup wlan0',
  check: 'ifconfig wlan0'
};

var execSync = require('child_process').execSync;

module.exports = {
  ssidCheck: function(ssid, cb){
    var wifiList = [];
    var scan = execSync(commands.scan);
    scan.stdout.on('message', function(data){
      wifiList.push(data)
    });
    scan.on('exit', function(){
      if ( wifiList.indexOf(ssid) === -1 ){
        cb('SSID Not Found')
      } else {
        cb(null, ssid)
      }
    })
  },
  connect: function(ssid, pass, cb){
    var writeStr = "network={\nssid=\""+ssid+"\"\npsk=\""+pass+"\"\n}";
    var file = execSync(commands.wpaFile);
    var fileOut = [];

    file.stdout.on('message', (data)=>{
      fileOut.push(data);
    });

    file.on('exit', () => {
      fileOut = fileOut.join('\n');
      var startIndex = fileOut.indexOf('network');
      if ( startIndex !== -1){
        // network exists
        var preNetwork = fileOut.substring(0, startIndex);
        var closeIndex = fileOut('}', startIndex);
        var networkChunk = fileOut.substring(startIndex, closeIndex+1);
        if ( networkChunk.indexOf(ssid) === )

      }

    })

  }
}
