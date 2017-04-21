var debug = debugLog('device.network');

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var exec = require('child_process').exec;
var _ = require('lodash');
var network = require('network');
var piwifi = require('pi-wifi');
var os = require('os');

var Network = function(config) {

  EventEmitter.call(this);

  // Value of network connection
  this.network = {};

  // True if we're connected to a network
  this.connected = false;

  this.connectTimer;

  // Time to check if network still connected
  this.connectionSpyFrequency = 30;

  // Interface to listen on. TODO: handle multiple
  this.iface = config.iface || 'wlan0';

  this.commands = _.extend({}, this.COMMANDS, config.commands);

  // Translates each individual command
  for (var command in this.commands) {
    this.commands[command] = this._translate(this.commands[command], {
      'interface': this.iface,
    });
  }
};

util.inherits(Network, EventEmitter);

Network.prototype.COMMANDS = {
  scan: 'sudo iwlist :INTERFACE scan', //scan networks
  stat: 'sudo iwconfig :INTERFACE', //get network information
  disable: 'sudo ifconfig :INTERFACE down', //disable network interface
  enable: 'sudo ifconfig :INTERFACE up', //enable network interface
  interfaces: 'sudo iwconfig', //get wireless interfaces
  leave: 'sudo iwconfig :INTERFACE essid ""' //disconnect network
};

// Translates strings. Looks for :SOMETHING in string, and replaces is with data.something.
Network.prototype._translate = function(string, data) {
  for (var index in data) {
    if (!data.hasOwnProperty(index)) break;
    string = string.replace(':' + index.toUpperCase(), data[index]);
  }

  return string;
};

// Stop listening
Network.prototype.stop = function(callback) {
  this.killing = true;
  clearInterval(this.connectTimer);

  this.emit('stop');

  callback && callback();
};


//Returns the current network status
Network.prototype.status = function(callback) {
  var self = this;

  piwifi.status(function(error, network) {
    if (error) {
      debug("Error getting wireless devices information", error.cmd);
      return callback(error);
    }

    self.network = network;
    return callback(null, self.network);
  });
}

// Enables the interface (ifconfig UP)
Network.prototype.enable = function(callback) {
  var self = this;

  this.emit('command', this.commands.enable);

  exec(this.commands.enable, function(err, stdout, stderr) {
    if (err) {
      if (err.message.indexOf("No such device")) {
        debug("The interface " + self.iface + " does not exist.");
        callback && callback(err);
        return;
      }

      debug("There was an unknown error enabling the interface" + err);
      callback && callback(err);
      return;
    }

    if (stdout || stderr) {
      debug("There was an error enabling the interface" + stdout + stderr);
      callback && callback(stdout || stderr);
      return;
    }

    callback && callback(null);
  });
};

// Disables the interface (ifconfig DOWN)
Network.prototype.disable = function(callback) {
  var self = this;

  this.emit('command', this.commands.disable);

  exec(this.commands.disable, function(err, stdout, stderr) {
    if (err) {
      debug("There was an unknown error disabling the interface" + err);
      callback && callback(err);
      return;
    }

    if (stdout || stderr) {
      debug("There was an error disabling the interface" + stdout + stderr);
      callback && callback(stdout || stderr);
    }

    callback && callback(null);
  });
};

// Attempts to disconnect from the specified network
Network.prototype.leave = function(callback) {
  var self = this;

  this.emit('command', this.commands.leave);
  exec(this.commands.leave, function(err, stdout, stderr) {
    if (err) {
      debug("There was an error when we tried to disconnect from the network");
      callback && callback(err);
      return;
    }

    callback && callback(null);
  });
};

// Checks to see if we are connected to a wireless network and have an IP address
Network.prototype.executeTrackConnection = function() {
  var self = this;

  piwifi.status(function(error, network) {
    if (error) {
      debug("Error getting wireless devices information", error.cmd);
      return;
    }

    if (!_.has(network, 'ssid') && !_.has(self.network, 'ssid')) {
      self.emit('empty');
    } else if (!_.has(self.network, 'ssid') && _.has(network, 'ssid')) {
      self.emit('join');
    } else if (_.has(self.network, 'ssid') && !_.has(network, 'ssid')) {
      self.emit('leave');
    } else if (self.network.ssid != network.ssid) {
      self.emit('change');
    }

    self.network = network;

  });
};

module.exports = {
  start: function() {
    var self = this;

    //check if device is connected with ethernet or wireless
    network.get_active_interface((err, networkInfo) => {

      if (err) return console.error(err);


      var type = networkInfo.type;

      self.network = new Network({ 'iface': (type === 'Wireless') ? networkInfo.name : null });

      // Are we connected?
      self.network.executeTrackConnection();
      self.network.connectTimer = setInterval(function() {
        self.network.executeTrackConnection();
      }, self.network.connectionSpyFrequency * 1000);

      self.network.on('change', function() {
        self.setStatus(networkInfo);
      });

      self.network.on('join', function() {
        Matrix.service.firebase.device.goCompleted();
        self.setStatus(networkInfo);
      });

      if (!error && type === 'Wired') {
        //update network data to firebase
        self.notify(networkInfo, networkInfo.type);
      } else if (!error && type === 'Wireless') {
        self.setStatus(networkInfo);
      }
    });
  },
  stop: function() {
    if (this.network) { this.network.stop(); }
  },

  setStatus: function(networkInfo) {
    var self = this;
    self.network.status((error, wifiData) => {
      if (!error) {
        networkInfo = _.merge(networkInfo, wifiData);
        self.notify(networkInfo, networkInfo.type);
      }
    });
  },

  notify: function(netData, type) {
    network.get_public_ip((error, ip) => {
      if (!error) {
        netData['ip'] = ip;
      }

      var netInfo = os.networkInterfaces()[netData.name] ||  {};
      netInfo = _.merge(netInfo[0], netData);

      var deviceNetwork = {
        'gateway': netInfo.gateway_ip || '',
        'localAddress': netInfo.address || '',
        'macAddress': netInfo.mac || '',
        'netmask': netInfo.netmask || '',
        'publicAddress': netInfo.ip || '',
        'ssid': type === 'Wired' ? 'ethernet' : netInfo.ssid
      }

      Matrix.service.firebase.device.updateNetwork(deviceNetwork);
    });
  }
}