var local = require('./env');
var _ = require('lodash');


var endpoints = {
  auth: {
    client:  '/v1/oauth2/client/token/',
    // authClient:  '/v1/oauth2/client/token/',
    user:  '/v1/oauth2/user/token/',
    refreshUserToken: '/v1/oauth2/user/refresh_token',
    // authUser:  '/v1/oauth2/user/token/',
    registerUser: '/v1/oauth2/user/register/',
  },
  device:{
    retriveToken: '/v1/device/token',
    register: '/v1/device/register',
    update: '/v1/device/update',
    registerAnonymous: '/v1/device/create',
    submit: '/v1/device/data/create',
    heartbeat: '/v1/device/heartbeat',
    list: '/v1/device/retrieve',
    // retriveUserDeviceList: '/v1/device/retrieve',
    // retriveUserDevices: '/v1/device/retrieve',
    // retriveDeviceData: '/v1/device/data/paginate',
    // requestDeviceDetails: '/admin/device/get'
  }
}

_.each(endpoints, function(category){
  for (var i in category){
    category[i] = local.url.api + category[i];
  }
});

module.exports = endpoints;

