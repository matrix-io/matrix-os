var noble = require("noble"); 

noble.on('discover', function(peripheral) {
  
  if(peripheral.address == "b8:27:eb:c6:0d:8c"){
    console.log("Found! peripheral.address: " + peripheral.address);
    peripheral.connect(function(error) {
      console.log('connected to peripheral: ' + peripheral.uuid);
      peripheral.discoverServices(['b1a6752152eb4d36e13e357d7c225465'], function(error, services) {
        var deviceInformationService = services[0];
        console.log('discovered device information service');
  
        deviceInformationService.discoverCharacteristics(['9e739ec2b3a24af0c4dc14f059a8a62a'], function(error, characteristics) {
          var manufacturerNameCharacteristic = characteristics[0];
          console.log('discovered manufacturer name characteristic');
  
          manufacturerNameCharacteristic.read(function(error, data) {
            // data is a buffer
            console.log('manufacture name is: ' + data.toString('utf8'));
          });
        });
      });
    });
  }
  
});

var serviceUuids = ['b1a6752152eb4d36e13e357d7c225465']; 
var allowDuplicates = true; 

noble.on('stateChange', function(state) {
  console.log("State changed!!!");
  if (state === 'poweredOn') {
    console.log("Powered on!");
    noble.startScanning(serviceUuids, allowDuplicates);
  } else {
    noble.stopScanning();
  }
});