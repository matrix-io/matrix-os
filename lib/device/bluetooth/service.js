var bleno = require('bleno');
var util = require('util');

var Service = function (options) {
  Service.super_.call(this, options);
};

util.inherits(Service, bleno.PrimaryService);