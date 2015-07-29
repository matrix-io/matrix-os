var fs = require('fs-extra');
var Matrix = require('../app').Matrix;
var should = require('should');



describe('Matrix<->Sensors', function() {
  this.timeout(15000)
  before( function(){
    //'can make a fake sensor for testing'
  });

  it('can initialize a sensor');
  it('cannot initialize a sensor twice');
  it('can read a sensor');
  it('can turn off a sensor');
  it('can hook up a sensor to an app and read the filter');
});
