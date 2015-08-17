
module.exports = {
  noinit: function() {

    /* This needs Help before it's ready */
    /* This is from adbeacon, mostly harmless */

    var events = require("events");
    var util = require("util");

    var LocationManager = require("./LocationManager");
    var waterfall = require('async-waterfall');
    var bleno = require('bleno');
    var Characteristic = bleno.Characteristic;
    var path = Matrix.config.path;
    var fs = require('fs');
    var DeviceFileModel = require('../fileModels/DeviceFileModel');
    var UserFileModel = require('../fileModels/UserFileModel');
    var AdmobilizeSDK = require('admobilize-node-sdk');
    var ConfigModel = require('../fileModels/ConfigFileModel');
    var deviceFileModel, userFileModel;
    var bluetoothManager, daemonManager, wifiManager, fileManager, locationManager;
    var deviceTokenData = {},
      authStatusData = {},
      deviceIdData = {},
      tokenData = {},
      deviceNameData = {},
      deviceDescriptionData = {},
      scanWifiData = {},
      detailsData = {},
      configWifiData = {},
      readBeaconImages = {},
      configWifiInputData = {},
      nameInputData = {},
      descriptionInputData = {},
      lastImageURLData = {},
      locationData = {};

    var listWifiData = "";
    var characteristicList = [];
    var authStatus = "false";
    var startupRestartCodes = [];
    var terminalRestartCodes = [];


    /*
    @module SetupManager
    @description SetupManager is the AdRemote "Server"
    */
    var userToken = "";
    var device;
    var console;
    var configModel = ConfigModel.getInstance();

    var SetupManager = function() {

      var self = this;
      bluetoothManager = Matrix.device.bluetooth;
      daemonManager = Matrix.device.daemon;
      wifiManager = Matrix.device.wifi;
      console = new LogManager();
      locationManager = new LocationManager();
      fileManager = new FileManager();
      startupRestartCodes = [4, 6, 7, 8];
      terminalRestartCodes = [4, 6, 7];

      waterfall([
          initWifiManager,
          wifiCheck,
          addResponseCharacteristic,
          addConfigUserTokenCharacteristic, // Add characteristic to receive user token
          addListWifiCharacteristic, // Add characteristic to send wifi networks list.
          addAdBeaconDetailsCharacteristic, //Add characteristic to read adbeacon details
          addConfigWifiCharacteristic, // Add characteristic to config wifi connection
          addConfigNameCharacteristic, // Add characteristic to change device name
          addConfigDescriptionCharacteristic, // Add characteristic to change device description
          addDeviceIdCharacteristic,
          addAuthStatusCharacteristic,
          addDeviceTokenCharacteristic,
          addDeviceLocationCharacteristic, //Add characteristic to get the location from adremote
          addReadBeaconImageCharacteristic,
          addReadLastImageURLCharacteristic,
          addDeviceOrientationCharacteristic, //Add characteristic to get the orientation from adremote
          createService, //Create service
          addBlenoListeners, //set bleno listeners
          startAdvertising //start advertising
        ],
        function(error) {
          if (error) {
            console.error("SetupManager -- ==BT== Error adding characteristics");
            console.error(error.stack);
          }
          return;
        });


      /*
      @method  initWifiManager
      @param {Function} next
      @description Initializes the Wifi manager
      */
      function initWifiManager(next) {
        console.info("SetupManager -- Init wifi manager");
        wifiManager.init(function(err) {
          if (!err) {
            next();
          } else {
            console.error("SetupManager -- Error! Failed to initialize Wifi");
            //TODO This should return an error
            next();
          }
        });
      }


      /*
      @method  wifiCheck
      @param {Function} next
      @description Verifies if there is a connection, else it tries to connect to an known network
      */
      function wifiCheck(next) {
        console.info("SetupManager -- Checking wifi");
        wifiManager.status(function(status) {
          if (status.ssid && status.ip_address) {
            next();
          } else {
            wifiManager.connect("0", function() {
              wifiManager.status(function(status) {
                if (status.ssid && status.ip_address) {
                  next();
                } else {
                  console.warn("SetupManager -- .Warning. Unable to connect to a known network");
                  next();
                }
              });
            });
          }
        });
      }


      /*
      @method  addResponseCharacteristic
      @param {Function} next
      @description add a characteristic to send response
      */
      function addResponseCharacteristic(next) {

        console.info("SetupManager -- ==BT== addResponseCharacteristic");
        var uuid = "9e739ec2b3a24af0c4dc14f059a8a628";
        var properties = ['notify'];
        var secure = [];
        var onSubscribe = onSubscribeResponseCharacteristic;
        var onUnsubscribe = onUnsubscribeResponseCharacteristic;

        bluetoothManager.createNotifyCharacteristic(uuid, properties, secure, onSubscribe, onUnsubscribe, function(error, newCharacteristic) {
          if (error) {
            console.error(error.stack);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });

      }


      /*
      @method  onSubscribeResponseCharacteristic
      @param {String} maxValueSize
      @param {Function} maxValueSize, updateValueCallback
      @description Setup update response event listener when subscribe to response characteristic
      */
      function onSubscribeResponseCharacteristic(maxValueSize, updateValueCallback) {
        console.info("SetupManager -- ==BT== !!!!!!!!!!!!!!  ON SUBSCRIBE  !!!!!!!!!!!!!!");
        self.on("updateResponse", function(response) {
          var responseData = {};

          if (authStatus == "true") {
            responseData.data = JSON.stringify(response);
            responseData.hightIndex = 20;
            responseData.lowIndex = 0;
            updateValueCallback(new Buffer("&start&"));
            while (responseData.data) {
              self.sendNotificationChunk(responseData, updateValueCallback);
            }
          }
        });
      }


      /*
      @method onUnsubscribeResponseCharacteristic
      @description Callback function  when unsubscribe to response characteristic
      */
      function onUnsubscribeResponseCharacteristic() {
        console.info("SetupManager -- ==BT== ¡¡¡¡¡¡¡¡¡¡¡¡¡¡  ON UNSUBSCRIBE  ¡¡¡¡¡¡¡¡¡¡¡¡¡¡");
      }


      /*
      @method configUserTokenCharacteristic
      @param {Function} next
      @description add a characteristic to receive a user token
      */
      function addConfigUserTokenCharacteristic(next) {
        console.warn("SetupManager -- ==BT== Config user token");
        var uuid = "9e739ec2b3a24af0c4dc14f059a8a629";
        var properties = ['write'];
        var secure = [];
        var onWriteRequest = setupUserToken;

        bluetoothManager.createWriteCharacteristic(uuid, properties, secure, onWriteRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }


      /*
      @method configUserTokenCharacteristic
      @param {Bytes} data
      @param {String} offset
      @param {Function} callback
      @param withoutResponse
      @description add a characteristic to receive a user token
      */
      function setupUserToken(data, offset, withoutResponse, callback) {
        self.receiveDataChunk(data, tokenData, callback, function(fullData) {
          userToken = fullData;
          callback(Characteristic.RESULT_SUCCESS);
        });
      }


      /*
      @method addListWifiCharacteristic
      @param {Function} next
      @description Add a characteristic that scan wifi networks and send a list with discovered networks
      */
      function addListWifiCharacteristic(next) {
        console.info("SetupManager -- ==BT== addListWifiCharacteristic");
        var uuid = "9e739ec2b3a24af0c4dc14f059a8a62a";
        var properties = ['read'];
        var secure = [];
        var onReadRequest = scanWifiNetworks;

        bluetoothManager.createReadCharacteristic(uuid, properties, secure, onReadRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error.stack);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }


      /*
      @method scanWifiNetworks
      @param {String} offset
      @param {Function} callback
      @description Scans wifi networks
      */
      function scanWifiNetworks(offset, callback) {
        console.info("SetupManager -- ==BT== Scan wifi  ");
        if (authStatus == "true") {
          if (!scanWifiData.data) {
            console.info("SetupManager -- ==BT== WIFI list ");
            wifiManager.scanNetworks(function(scanNetworks) {

              if (scanNetworks && scanNetworks.length > 0) {
                scanWifiData.data = JSON.stringify(scanNetworks);
                scanWifiData.hightIndex = 20;
                scanWifiData.lowIndex = 0;
                callback(Characteristic.RESULT_SUCCESS, new Buffer("&start&"));
              } else {
                wifiManager.init(function() {
                  console.info("SetupManager -- ==BT== Wifi restarting");
                  scanWifiData.data = "";
                  scanWifiData.hightIndex = 20;
                  scanWifiData.lowIndex = 0;
                  self.sendDataChunk(scanWifiData, callback);
                });
              }
            });

          } else {
            self.sendDataChunk(scanWifiData, callback);
          }
        } else {
          console.error("Scan wifi network , not enough permissions");
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }
      }


      /*
      @method addListWifiCharacteristic
      @param {Function} next
      @description Add a characteristic to send the adbeacon details
      */
      function addAdBeaconDetailsCharacteristic(next) {
        console.info("SetupManager -- ==BT== Details");

        var uuid = "9e739ec2b3a24af0c4dc14f059a8a62b";
        var properties = ['read'];
        var secure = [];
        var onReadRequest = requestAdbeaconDetails;

        bluetoothManager.createReadCharacteristic(uuid, properties, secure, onReadRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }


      /*
      @method requestAdbeaconDetails
      @param {String} offset
      @param {Function} callback
      @description Request the adbeacon details (name, description and wifi settings)
      */
      function requestAdbeaconDetails(offset, callback) {
        console.info("SetupManager -- ==BT== Request adbeacon details ");
        if (authStatus == "true") {
          if (!detailsData.data) {
            console.info("SetupManager -- ==BT== AdBeacon Details");
            deviceFileModel = new DeviceFileModel();
            deviceFileModel.getDevice(function(error, device) {

              if (error) {
                console.error("SetupManager -- ==BT== Error getDevice");
                console.error(error.message);
                callback(Characteristic.RESULT_UNLIKELY_ERROR);

              } else if (device) {
                wifiManager.status(function(currentStatus) {
                  var details = device;
                  var pathToPhoto = routes.currentPhotosFolder;
                  var imagePath = pathToPhoto + '/lastPhoto.jpg';
                  details.network = currentStatus;
                  delete details.deviceToken;

                  require('getmac').getMac(function(err, macAddress) {
                    details.deviceId = macAddress;

                    fileManager.exists(path.root + "public/files/orientation", function(exists) {
                      if (exists === false) {
                        fileManager.createParamValueFile({
                          orientation: 0
                        }, "orientation");
                      }

                      fileManager.readParamValueFile("orientation", function(orientationJson) {
                        var orientation;
                        if (!orientationJson || typeof orientationJson.orientation == 'undefined') {
                          orientation = 0;
                        } else {
                          orientation = orientationJson.orientation;
                        }
                        details.orientation = orientation;
                        console.info("SetupManager -- Device info " + JSON.stringify(details));
                        detailsData.data = JSON.stringify(details);
                        detailsData.hightIndex = 20;
                        detailsData.lowIndex = 0;
                        callback(Characteristic.RESULT_SUCCESS, new Buffer("&start&"));
                      });
                    });
                  });
                });
              } else {
                console.error("SetupManger - No device found ");
                callback(Characteristic.RESULT_UNLIKELY_ERROR);
              }
            });
          } else {
            self.sendDataChunk(detailsData, callback);
          }
        } else {
          console.error("SetupManager --- Request details error , not enough permissions");
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }
      }


      /*
      @method addConfigWifiCharacteristic
      @param {Function} next
      @description Add a characteristic to send and receive adbeacon wifi configuration
      */
      function addConfigWifiCharacteristic(next) {
        console.info("SetupManager -- ==BT== WIFI Config");

        var uuid = "9e739ec2b3a24af0c4dc14f059a8a62c";
        var properties = ['read', 'write'];
        var secure = [];
        var onReadRequest = getWifiStatus;
        var onWriteRequest = setupWifiConfiguration;

        bluetoothManager.createReadAndWriteCharacteristic(uuid, properties, secure, onReadRequest, onWriteRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }


      /*
      @method getWifiConfiguration
      @param {Function} next
      @description Get the current status of the wifi connection
      */
      function getWifiStatus(offset, callback) {
        if (authStatus == "true") {
          if (!configWifiData.data) {
            console.info("SetupManager -- ==BT== Config wifi");
            wifiManager.status(function(currentStatus) {
              configWifiData.data = JSON.stringify(currentStatus);
              configWifiData.hightIndex = 20;
              configWifiData.lowIndex = 0;
              callback(Characteristic.RESULT_SUCCESS, new Buffer("&start&"));
            });
          } else {
            self.sendDataChunk(configWifiData, callback);
          }
        } else {
          console.error("SetupManager --- Wifi status, not enough permissions");
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }
      }


      /*
      @method setupWifiConfiguration
      @param data
      @param offset
      @param withoutResponse
      @param {Function} callback
      @description Setup a new wifi network
      */
      function setupWifiConfiguration(data, offset, withoutResponse, callback) {
        try {
          if (authStatus == "true") {
            self.receiveDataChunk(data, configWifiInputData, callback, function(networkConfiguration) {
              if (networkConfiguration.trim()) {
                console.info("SetupManager -- ==BT== Network Configuration " + networkConfiguration);
                var networkConfig = JSON.parse(networkConfiguration);
                //console.info("SetupManager -- SSID " + networkConfig['ssid']);
                var ssid = networkConfig['ssid'];
                var password = networkConfig['pwd'];
                var security;
                if (networkConfig['security']) {
                  security = networkConfig['security'];
                } else {
                  self.getNetworkSecurity(ssid, function(networkSecurity) {
                    security = networkSecurity;
                  });
                }

                waterfall([
                    function(next) { //check if the network is a configured network
                      wifiManager.getConfiguredNetworkBySSID(ssid, function(network) {
                        next(null, network);
                      });
                    },
                    function(network, next) {
                      if (network) {
                        //if network already exists then update it
                        wifiManager.setNetwork(ssid, password, network.network_id, security, function() {
                          next(null, network.network_id);
                        });
                      } else {
                        //remove all networks configurated and add  the new network
                        wifiManager.removeAllNetworks(function(error) {
                          if (!error) {
                            wifiManager.addNetwork(networkConfig.ssid, networkConfig.pwd, security, next);
                            wifiManager.saveConfiguration();
                          } else {
                            next(error);
                          }
                        });
                      }
                    },
                    function(networkId, next) { //connect network
                      wifiManager.connect(networkId, function() {
                        next(null, networkId);
                      });
                    },
                    function(networkId, next) { //check if the network connection was successfull
                      wifiManager.status(function(currentStatus) {
                        console.info("SetupManager -- The status " + currentStatus);
                        if (currentStatus.ssid == ssid && currentStatus.ip_address) {
                          self.emit("updateResponse", {
                            characteristic: 3,
                            status: "OK",
                            result: "Connected to  " + ssid
                          });
                          self.emit("networkChange", currentStatus.ssid);
                          callback(Characteristic.RESULT_SUCCESS);
                          next();
                        } else {
                          self.emit("updateResponse", {
                            characteristic: 3,
                            status: "error",
                            result: "Network configuration can't be empty"
                          });
                          callback(Characteristic.RESULT_UNLIKELY_ERROR);
                        }
                      });
                    }
                  ],
                  function(error) {
                    //TODO Do something
                  });
              } else {
                console.error("SetupManager -- No configuration was sent");
                callback(Characteristic.RESULT_UNLIKELY_ERROR);
              }
            });
          } else {
            console.error("SetupManager -- No auth status");
            callback(Characteristic.RESULT_UNLIKELY_ERROR);
          }
        } catch (error) {
          console.error("SetupManager -- Wifi configuration error");
          console.error(error.stack);
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }
      }


      /*
      @method addConfigNameCharacteristic
      @param {Function} next
      @description Add a characteristic to send and receive the AdBeacon device name
      */
      function addConfigNameCharacteristic(next) {
        console.info("SetupManager -- ==BT== Name");

        var uid = "9e739ec2b3a24af0c4dc14f059a8a62d";
        var properties = ['read', 'write'];
        var secure = [];
        var onReadRequest = getAdbeaconName;
        var onWriteRequest = setAdbeaconName;

        bluetoothManager.createReadAndWriteCharacteristic(uid, properties, secure, onReadRequest, onWriteRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }


      /*
      @method setAdbeaconName
      @param  data
      @param  offset
      @param withoutResponse
      @param {Function} callback
      @description Set name for the AdBeacon
      */
      function setAdbeaconName(data, offset, withoutResponse, callback) {

        try {
          if (authStatus == "true") {
            self.receiveDataChunk(data, nameInputData, callback, function(deviceName) {
              console.info("SetupManager -- ==BT== Changing name");
              //If name isn't empty
              if (deviceName.trim()) {
                device.updateDevice({
                  name: deviceName
                }, function(error, response) {
                  if (error) {
                    //throw error;
                    if (response && response.tokenError) {
                      self.emit("updateResponse", {
                        characteristic: 4,
                        status: "error",
                        result: "Invalid token"
                      });
                    } else {
                      self.emit("updateResponse", {
                        characteristic: 4,
                        status: "error",
                        result: "Error updating device in API server"
                      });
                    }

                    console.error(error.stack);
                    callback(Characteristic.RESULT_UNLIKELY_ERROR);
                  } else {
                    deviceFileModel = new DeviceFileModel();
                    deviceFileModel.saveName(deviceName, function(error) {
                      if (error) {
                        self.emit("updateResponse", {
                          characteristic: 4,
                          status: "error",
                          result: "Error updating device locally"
                        });
                        console.error("SetupManager -- Error, Updating device name");
                        console.error(error.stack);
                        callback(Characteristic.RESULT_UNLIKELY_ERROR);
                      } else {
                        self.emit("updateResponse", {
                          characteristic: 4,
                          status: "OK",
                          result: "Device name was successfully updated"
                        });
                        callback(Characteristic.RESULT_SUCCESS);
                        self.restartAdvertising();
                      }
                    });
                  }
                });
              } else {
                console.warn("SetupManager -- .Warning. Device name is empty");
                self.emit("updateResponse", {
                  characteristic: 4,
                  status: "error",
                  result: "Device name can't be empty"
                });
                callback(Characteristic.RESULT_UNLIKELY_ERROR);
              }
            });
          } else {
            callback(Characteristic.RESULT_UNLIKELY_ERROR);
          }
        } catch (error) {
          console.error(error.stack);
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }
      }


      /*
      @method getAdbeaconName
      @param offset
      @param {Function} callback
      @description On read callback to get the AdBeacon name
      */
      function getAdbeaconName(offset, callback) {

        try {
          if (authStatus == "true") {
            if (!deviceNameData.data) {
              console.info("SetupManager -- ==BT== Read name");
              deviceFileModel.getDevice(function(error, deviceData) {
                if (error) {
                  console.error("SetupManager -- Error getDevice");
                  console.error(error.stack);
                  callback(new Error("No device found"));
                }

                console.info("SetupManager -- ==BT== Device name " + deviceData.name);
                deviceNameData.data = JSON.stringify(deviceData.name);
                deviceNameData.hightIndex = 20;
                deviceNameData.lowIndex = 0;
                callback(Characteristic.RESULT_SUCCESS, new Buffer("&start&"));
              });
            } else {
              self.sendDataChunk(deviceNameData, callback);
            }
          } else {
            callback(Characteristic.RESULT_UNLIKELY_ERROR);
          }
        } catch (error) {
          console.error(error.stack);
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }

      }


      /*
      @method addConfigDescriptionCharacteristic
      @param {Function} next
      @description Add a characteristic to send and receive AdBeacon device description
      */
      function addConfigDescriptionCharacteristic(next) {
        console.info("SetupManager -- ==BT== Description");

        var uuid = "9e739ec2b3a24af0c4dc14f059a8a62e";
        var properties = ['read', 'write'];
        var secure = [];
        var onReadRequest = getAdbeaconDescription;
        var onWriteRequest = setAdbeaconDescription;

        bluetoothManager.createReadAndWriteCharacteristic(uuid, properties, secure, onReadRequest, onWriteRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }


      /*
      @method getAdbeaconDescription
      @param offset
      @param {Function} callback
      @description On read callback  get the AdBeacon description
      */
      function getAdbeaconDescription(offset, callback) {

        try {
          if (authStatus == "true") {
            if (!deviceDescriptionData.data) {
              console.info("SetupManager -- ==BT== Description");

              deviceFileModel.getDevice(function(error, device) {
                if (error) {
                  console.error("SetupManager -- Error getDevice");
                  console.error(error.stack);
                  callback(new Error("No device found"));
                }

                console.info("SetupManager -- ==BT== Device description " + device.description);
                deviceDescriptionData.data = JSON.stringify(device.description);
                deviceDescriptionData.hightIndex = 20;
                deviceDescriptionData.lowIndex = 0;
                callback(Characteristic.RESULT_SUCCESS, new Buffer("&start&"));

              });
            } else {
              self.sendDataChunk(deviceDescriptionData, callback);
            }
          } else {
            self.emit("updateResponse", {
              characteristic: 5,
              status: "error",
              result: "User is not authenticated"
            });
            callback(Characteristic.RESULT_UNLIKELY_ERROR);
          }
        } catch (error) {
          self.emit("updateResponse", {
            characteristic: 5,
            status: "error",
            result: error.stack
          });
          console.error(error.stack);
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }
      }


      /*
      @method setAdbeaconDescriptio
      @param  data
      @param  offset
      @param withoutResponse
      @param {Function} callback
      @description Set name for the adbeacon
      */
      function setAdbeaconDescription(data, offset, withoutResponse, callback) {

        try {
          if (authStatus == "true") {
            self.receiveDataChunk(data, descriptionInputData, callback, function(deviceDescription) {
              device.updateDevice({
                description: deviceDescription
              }, function(error, response) {
                if (!error) {
                  deviceFileModel = new DeviceFileModel();
                  deviceFileModel.saveDescription(deviceDescription, function(error) {
                    if (error) {
                      self.emit("updateResponse", {
                        characteristic: 5,
                        status: "error",
                        result: "Error updating device locally"
                      });
                      console.error(error.stack);
                      console.error("SetupManager -- Error, failed to update description");
                      callback(Characteristic.RESULT_UNLIKELY_ERROR);
                    } else {
                      self.emit("updateResponse", {
                        characteristic: 5,
                        status: "OK",
                        result: "Description was update succesfully"
                      });
                      callback(Characteristic.RESULT_SUCCESS);
                    }
                  });
                } else {
                  if (response && response.tokenError) {
                    self.emit("updateResponse", {
                      characteristic: 4,
                      status: "error",
                      result: "Invalid token"
                    });
                  } else {
                    self.emit("updateResponse", {
                      characteristic: 5,
                      status: "error",
                      result: "Error updating device to API server"
                    });
                  }
                  console.error(error.stack);
                  callback(Characteristic.RESULT_UNLIKELY_ERROR);
                }
              });
            });
          } else {
            self.emit("updateResponse", {
              characteristic: 5,
              status: "error",
              result: ""
            });
            callback(Characteristic.RESULT_UNLIKELY_ERROR);
          }
        } catch (error) {
          console.error(error.stack);
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }

      }


      /*
      @method addDeviceIdCharacteristic
      @param {Function} next
      @description Add a characteristic to send the AdBeacon details
      */
      function addDeviceIdCharacteristic(next) {
        console.info("SetupManager -- ==BT== Device id");

        var uuid = "9e739ec2b3a24af0c4dc14f059a8a62f";
        var properties = ['read'];
        var secure = [];
        var onReadRequest = getDeviceId;

        bluetoothManager.createReadCharacteristic(uuid, properties, secure, onReadRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }


      /*
      @method getDeviceId
      @param offset
      @param {Function} callback
      @description Get device id (and send it by chunks)
      */
      function getDeviceId(offset, callback) {

        if (userToken != "") {
          if (!deviceIdData.data) {
            configModel.getConfigParameter("environment", function(error, currentEnvironment) {
              //TODO Deal with config error
              console.info("SetupManager -- ==BT== Current environment " + currentEnvironment);
              if (currentEnvironment) {
                console.info("SetupManager -- ==BT== Read device id and environment");
                require('getmac').getMac(function(err, macAddress) {
                  var details = {
                    deviceId: macAddress,
                    environment: currentEnvironment
                  };
                  deviceIdData.data = JSON.stringify(details);
                  deviceIdData.hightIndex = 20;
                  deviceIdData.lowIndex = 0;
                  callback(Characteristic.RESULT_SUCCESS, new Buffer("&start&"));
                });

              } else {
                console.error("SetupManager -- ==BT==  Error in request device id, no environment  token found ");
                callback(Characteristic.RESULT_UNLIKELY_ERROR);
              }
            });
          } else {
            console.warn("Sending chunk device id");
            self.sendDataChunk(deviceIdData, callback);
          }
        } else {
          console.error("SetupManager -- ==BT==  Error in request device id, no user token found ");
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }
      }


      /*
      @method addAuthStatusCharacteristic
      @param {Function} next
      @description Add a characteristic to send the adbeacon details
      */
      function addAuthStatusCharacteristic(next) {
        console.info("SetupManager -- ==BT== Auth status");
        var uuid = "9e739ec2b3a24af0c4dc14f059a8a630";
        var properties = ['read'];
        var secure = [];
        var onReadRequest = checkAuthStatus;

        bluetoothManager.createReadCharacteristic(uuid, properties, secure, onReadRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }


      /*
      @method checkAuthStatus
      @param {String} offset
      @param {Function}  callback
      @description Add a characteristic to send the adbeacon details
      */
      function checkAuthStatus(offset, callback) {
        if (userToken != "") {
          if (!authStatusData.data) {
            console.info("SetupManager -- ==BT== Read auth status");
            authStatusData.data = authStatus;
            authStatusData.hightIndex = 20;
            authStatusData.lowIndex = 0;
            callback(Characteristic.RESULT_SUCCESS, new Buffer("&start&"));
          } else {
            self.sendDataChunk(authStatusData, callback);
          }
        } else {
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }
      }


      /*
      @method addListWifiCharacteristic
      @param {Function} next
      @description Add a characteristic to receive device token
      */
      function addDeviceTokenCharacteristic(next) {
        console.info("SetupManager -- ==BT== Device token");

        var uuid = "9e739ec2b3a24af0c4dc14f059a8a631";
        var properties = ['write'];
        var secure = [];
        var onWriteRequest = compareDeviceToken;

        bluetoothManager.createWriteCharacteristic(uuid, properties, secure, onWriteRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }


      /*
      @method compareDeviceToken
      @param {Function} callback
      @description Receive a device token by chunks and compare it with the current device token
      */
      function compareDeviceToken(data, offset, withoutResponse, callback) {
        console.info("SetupManager -- ==BT== compareDeviceToken ");
        self.receiveDataChunk(data, deviceTokenData, callback, function(deviceToken) {
          console.info("SetupManager -- ==BT== The device token " + deviceToken);
          deviceFileModel.getDevice(function(error, deviceData) {
            if (error) {
              console.error("SetupManager -- ==BT== Error getDevice");
              console.error(error.stack);
              callback(new Error("No device found"));
            } else if (deviceData.deviceToken) {
              if (deviceData.deviceToken == deviceToken) { //if has device token compares with the one sent by AdRemote
                console.info("SetupManager -- ==BT== Device token match (OK)");
                authStatus = "true";
                userFileModel.saveAccessToken(userToken, function(error) {
                  if (!error) {
                    self.emit("updateResponse", {
                      characteristic: 9,
                      status: "OK",
                      result: "Authentication was successfull"
                    });
                    callback(Characteristic.RESULT_SUCCESS);
                    self.emit("authenticatedUser", userToken);
                  } else {
                    console.error("SetupManager -- Error, Saving access token");
                    console.error(error.stack);
                  }
                });
              } else {
                console.info("SetupManager -- ==BT== Device token mismatch (X)");
                self.emit("updateResponse", {
                  characteristic: 9,
                  status: "error",
                  result: "Is not a valid device token"
                });
                authStatus = "false";
                callback(Characteristic.RESULT_UNLIKELY_ERROR);
              }

            } else {
              console.info("SetupManager -- ==BT== Adding new device token");
              authStatus = "true";
              userFileModel.saveAccessToken(userToken, function(error) {
                if (!error) {
                  deviceFileModel.saveDeviceToken(deviceToken, function(error) {
                    if (!error) {
                      self.emit("updateResponse", {
                        characteristic: 9,
                        status: "OK",
                        result: "Authentication was successfull"
                      });
                      callback(Characteristic.RESULT_SUCCESS);
                      console.info("SetupManager -- ==BT== User authenticated with new token ");
                      self.emit("authenticatedUser", userToken);
                    } else {
                      console.error("SetupManager -- Error, unable to save new device token");
                      console.error(error.stack);
                      self.emit("updateResponse", {
                        characteristic: 9,
                        status: "error",
                        result: "Error saving access token"
                      });
                      callback(Characteristic.RESULT_UNLIKELY_ERROR);
                    }
                  });
                } else {
                  console.error("SetupManager -- Error saving user token");
                  console.error(error.stack);
                  self.emit("updateResponse", {
                    characteristic: 9,
                    status: "error",
                    result: "Error saving access token"
                  });
                  callback(Characteristic.RESULT_UNLIKELY_ERROR);
                }
              });
            }
          });
          callback(Characteristic.RESULT_SUCCESS);
        });
      }


      /*
      @method addDeviceLocationCharacteristic
      @param {Function} next
      @description Add a characteristic to receive location coordinates from AdRemote.
      */
      function addDeviceLocationCharacteristic(next) {
        console.info("SetupManager -- ==BT== Device location");

        var uuid = "9e739ec2b3a24af0c4dc14f059a8a634";
        var properties = ['write'];
        var secure = [];
        var onWriteRequest = locationCharacteristic;

        bluetoothManager.createWriteCharacteristic(uuid, properties, secure, onWriteRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }



      function locationCharacteristic(data, offset, withoutResponse, callback) {
        self.receiveDataChunk(data, locationData, callback, function(fullData) {
          try {
            var coordinates = {};
            if (fullData) {
              coordinates = JSON.parse(fullData);
              fileManager.createParamValueFile(coordinates, "coordinates");

              console.info("SetupManager -- ==BT== Write Coordinates");
              console.info(coordinates);
              callback(Characteristic.RESULT_SUCCESS);
            } else {
              console.error("SetupManager -- ==BT== Error writing Coordinates");
              callback(Characteristic.RESULT_UNLIKELY_ERROR);
            }
          } catch (err) {
            callback(Characteristic.RESULT_UNLIKELY_ERROR);
          }
        });
      }


      /*
      @method addDeviceOrientationCharacteristic
      @param {Function} next
      @description Add a characteristic to receive beacon orientation.
      */
      function addDeviceOrientationCharacteristic(next) {
        console.info("SetupManager -- ==BT== Device Orientation");

        var uuid = "9e739ec2b3a24af0c4dc14f059a8a635";
        var properties = ['write'];
        var secure = [];
        var onWriteRequest = orientationCharacteristic;

        bluetoothManager.createWriteCharacteristic(uuid, properties, secure, onWriteRequest, function(error, newCharacteristic) {
          if (error) {
            console.error(error);
            next(error);
          } else {
            characteristicList.push(newCharacteristic);
            next();
          }
        });
      }


      /*
       * @method orientationCharacteristic
       * @param {Function} callback
       * @description set adbeacon orientation.
       */
      function orientationCharacteristic(data, offset, withoutResponse, callback) {
        self.receiveDataChunk(data, locationData, callback, function(fullData) {
          console.info("SetupManager -- ==BT== write orientation...");
          try {
            if (fullData) {
              var orientation = JSON.parse(fullData);
              if (orientation) {
                var now = new Date();
                orientation["updatedAt"] = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()).getTime();
                fileManager.createParamValueFile(orientation, "orientation");
                self.emit('orientationChanged');
                callback(Characteristic.RESULT_SUCCESS);
              } else {
                callback(Characteristic.RESULT_UNLIKELY_ERROR);
              }
            } else {
              callback(Characteristic.RESULT_UNLIKELY_ERROR);
            }
          } catch (err) {
            callback(Characteristic.RESULT_UNLIKELY_ERROR);
          }
        });
      };


      /*
      @method setDevice
      @param {Device} aDevice
      @description Set device
      */
      self.setDevice = function(aDevice) {
        console.info("SetupManager -- ==BT== Set Device");
        device = aDevice;
      };


      /*
      @method restartAdvertising
      @description restart advertising
      */
      self.getNetworkSecurity = function(ssid, callback) {
        var listNetworks;

        if (scanWifiData.data) {
          listNetworks = scanWifiData.data;
        } else {
          wifiManager.scanNetworks(function(scanNetworks) {
            listNetworks;
          });
        }

        for (var i in listNetworks) {
          if (listNetworks[i]['ssid'] == ssid) {
            callback(listNetworks[i]['flags']);
            break;
          }
          if (i == listNetworks.length - 1) {
            callback(null);
          }
        }
      };


      /*
      @method sendDataChunk
      @param {Object} fullData
      @param {Function} callback
      @description Send data by request in chunks
      */
      self.sendDataChunk = function(fullData, callback) {
        var bufferMessage;
        try {
          if (fullData.isImage) bufferMessage = new Buffer(fullData.data, "base64");
          else bufferMessage = new Buffer(fullData.data, "utf-8");

          //If the data that we want send is lower than 20 characteres send that data
          if (fullData.hightIndex > bufferMessage.length) {
            if (fullData.lowIndex < bufferMessage.length) {
              callback(Characteristic.RESULT_SUCCESS, bufferMessage.slice(fullData.lowIndex, bufferMessage.length));
              fullData.lowIndex += (fullData.isImage) ? 132 : 20;
            } else {
              delete fullData.data;
              delete fullData.lowIndex;
              delete fullData.hightIndex;
              if (fullData.isImage) console.info("SetupManager -- ==BT== Adbeacon Send image via bluetooth");
              if (fullData.isImage) delete fullData.isImage;
              callback(Characteristic.RESULT_SUCCESS, new Buffer("&end&"));
            }

          } else {
            callback(Characteristic.RESULT_SUCCESS, bufferMessage.slice(fullData.lowIndex, fullData.hightIndex));
            fullData.lowIndex += (fullData.isImage) ? 132 : 20;
            fullData.hightIndex += (fullData.isImage) ? 132 : 20;
          }
        } catch (error) {
          callback(Characteristic.RESULT_UNLIKELY_ERROR);
        }
      };


      /*
      @method sendNotificationChunk
      @param {Object} fullData
      @param {Function} callback
      @description Send data by request in chunks
      */
      self.sendNotificationChunk = function(fullData, callback) {
        var bufferMessage = new Buffer(fullData.data, "utf-8");
        if (fullData.hightIndex > bufferMessage.length) { //If the data that we want send is lower than 20 characteres send that data

          if (fullData.lowIndex < bufferMessage.length) {
            callback(bufferMessage.slice(fullData.lowIndex, bufferMessage.length));
            fullData.lowIndex += 20;
          } else {
            delete fullData.data;
            delete fullData.lowIndex;
            delete fullData.hightIndex;
            callback(new Buffer("&end&"));
          }
        } else {
          callback(bufferMessage.slice(fullData.lowIndex, fullData.hightIndex));
          fullData.lowIndex += 20;
          fullData.hightIndex += 20;
        }
      };


      /*
      @method receiveDataChunk
      @description Get data  in chunks
      */
      self.receiveDataChunk = function(chunk, inputData, callback, finalCallback) {
        if (chunk == "&start&") {
          inputData.data = "";
          callback(Characteristic.RESULT_SUCCESS);
        } else if (chunk == "&end&") {
          if (inputData.data || inputData.data.trim() === "") {
            finalCallback(inputData.data);
            delete inputData.data;
          } else {
            console.warn("SetupManager -- ==BT== A end message was sent with no start");
            callback(Characteristic.RESULT_UNLIKELY_ERROR);
          }

        } else {
          inputData.data += chunk;
          callback(Characteristic.RESULT_SUCCESS);
        }
      };


      /*
      @method updateStartupRepository
      @description Clones or updates the startup repository
      */
      self.updateFreshRunRepository = function(callback) {
        console.info("SetupManager -- Updating fresh run repository");

        var results = {
          "success": {
            "0": "Branch was already up to date",
            "4": "Repository cloned",
            "6": "Changed branch and updated",
            "7": "Branch updated",
            "8": "Changes found update"
          },
          "error": {
            "1": "Invalid arguments supplied",
            "2": "Sudo required",
            "5": "Unable to clone repository",
            "9": "Unexpected end of script"
          }
        };

        // TODO: Run these from node_modules not repos
        var cloneCommand = "sudo sh " + path.root + "daemon/cloneRepository.sh " + routes.freshRunModule;
        daemonManager.executeCommand(cloneCommand, function(stdout) {
          console.info("SU-OUT>> " + stdout);
        }, function(stderr) {}, function(command) {
          command.on('close', function(code) {
            if (results.success[code]) {
              console.info("SetupManager -- Startup Repository check passed:");
              console.info("SetupManager --  L> " + results.success[code]);
              var shouldRestart = startupRestartCodes.indexOf(code) > -1;
              callback(null, code, shouldRestart);

            } else if (results.error[code]) { //Repository doesn't exist or permission denied
              callback(new Error("Unable to clone repository (" + code + "): " + results.error[code]), code);
            } else {
              callback(new Error('Unable to clone repository (' + code + ')'), code);
            }
          });
        });
      };


      /*
      @method updateTerminalRepository
      @description Clones or updates the startup repository
      */
      self.updateTerminalRepository = function(callback) {
        console.info("SetupManager -- Updating remote terminal repository");

        var results = {
          "success": {
            "0": "Branch was already up to date",
            "4": "Repository cloned",
            "6": "Changed branch and updated",
            "7": "Branch updated",
            "8": "Changes found update"
          },
          "error": {
            "1": "Invalid arguments supplied",
            "2": "Sudo required",
            "5": "Unable to clone repository",
            "9": "Unexpected end of script"
          }
        };

        var cloneCommand = "sudo sh " + routes.rootDirectory + "daemon/cloneRepository.sh " + routes.terminalRepositoryPath + " " + routes.terminalRepositoryFolder + " " + routes.terminalRepositoryURL + " master";
        daemonManager.executeCommand(cloneCommand, function(stdout) {
          console.info("TU-OUT>> " + stdout);
        }, function(stderr) {}, function(command) {
          command.on('close', function(code) {
            if (results.success[code]) {
              console.info("SetupManager -- Terminal Repository check passed:");
              console.info("SetupManager --  L> " + results.success[code]);
              var shouldRestart = terminalRestartCodes.indexOf(code) > -1;
              callback(null, code, shouldRestart);

            } else if (results.error[code]) { //Repository doesn't exist or permission denied
              callback(new Error("Unable to clone repository (" + code + "): " + results.error[code]), code);
            } else {
              callback(new Error('Unable to clone repository (' + code + ')'), code);
            }
          });
        });
      };


      /*
      @method checkTerminal
      @description Makes sure the temrinal is running
      */
      self.checkTerminal = function(callback) {
        console.info("SetupManager -- Checking terminal...");
        self.terminalRunningState(function(isRunning) {
          if (!isRunning) {
            self.startTerminal(function(error) {
              if (!error) {
                console.info("SetupManager -- Terminal process started");
              } else {
                console.error("SetupManager -- Unable to start the terminal process");
              }
              callback(error);
            });
          } else {
            console.info("SetupManager -- Terminal process already running");
            callback();
          }
        });
      };


      /*
      @method startTerminal
      @description Starts the remote terminal
      */
      self.startTerminal = function(callback) {
        console.info("SetupManager -- Starting terminal...");
        var error;
        var startCommand = "sudo service adterminal start";
        daemonManager.executeCommand(startCommand, function(stdout) {}, function(stderr) {}, function(command) {
          command.on('close', function(code) {
            if (code != 0) {
              error = new Error("Unable to start the terminal (" + code + ")");
            }
            callback(error);
          });
        });
      };


      /*
      @method restartTerminal
      @description Starts the remote terminal
      */
      self.restartTerminal = function(callback) {
        console.info("SetupManager -- Restarting terminal...");
        var error;
        var restartCommand = "sudo service adterminal restart";
        daemonManager.executeCommand(restartCommand, function(stdout) {}, function(stderr) {}, function(command) {
          command.on('close', function(code) {
            if (code != 0) {
              error = new Error("Unable to restart the terminal (" + code + ")");
            }
            callback(error);
          });
        });
      };


      /*
      @method terminalRunningState
      @description Starts the remote terminal
      */
      self.terminalRunningState = function(callback) {
        console.info("SetupManager -- Searching for the terminal process...");
        var isRunning = true;
        var runningCommand = "sudo ps -fea | grep -v grep | grep admobilize-cli";
        daemonManager.executeCommand(runningCommand, function(stdout) {}, function(stderr) {}, function(command) {
          command.on('close', function(code) {
            if (code != 0) {
              isRunning = false;
            }
            callback(isRunning);
          });
        });
      };

    };

  }
}
