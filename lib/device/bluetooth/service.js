var optional = require('optional');
var bleno = optional('bleno');
var util = require('util');

var Service = function (options) {
  Service.super_.call(this, options);
};

var blenoPrimaryService;
if (bleno) blenoPrimaryService = bleno.PrimaryService;

util.inherits(Service, blenoPrimaryService);