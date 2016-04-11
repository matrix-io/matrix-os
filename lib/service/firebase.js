var debug = debugLog(firebase);

var F = require( 'firebase' );
var firebase = new F( 'https://asd.firebaseio.com/' );

// application keys as names
var fbx = {};


// use child to maintain position
module.exports = {
    instance: firebase,
    getUserBase: getUserBase,
    getAppBase: getAppBase,
    getDeviceBase: getDeviceBase,

    setupAppListener: function setupAppListener( appInfo ){
      var ref = getAppBase( appName );
    },

    getAppConfig: function getAppConfig( appInfo, cb ) {
      var ref = getAppBase( appInfo );

      ref.on('value', function (app) {
        debug('[FB}->'.blue, app);
        cb(null, app);
      }, function (err) {
        cb(err);
      });

    },
    updateAppConfig: function updateAppConfig( appInfo, newConfig, cb ) {
      var ref = getAppBase( appInfo );

      debug(appInfo, '[FB}<-'.blue, newConfig);

      // WARN: this will overwite nested configurations
      ref.update( newConfig, function(err){
        if(err) cb(err); else cb()
      });
    },

}


// return this ref to do stuff with
 function __pathBase( path ) {
  debug('[FB+'.blue, path);

  return firebase.child(path);
 }


function __getAppPath( appInfo ) {
  if ( _.isUndefined( appInfo.userId && appInfo.deviceId && appInfo.appId && newConfig )){
    return new Error('Invalid app information passed' + JSON.parse(appInfo));
  }

  return path = [ userId, deviceId, appid ].join('/');
}

function getAppBase( appInfo ){
  return __pathBase( __getAppPath(appInfo) );
}

function getDeviceBase( deviceInfo ){
  return __pathBase( __getDevicePath(deviceInfo) );
}
function __getDevicePath( deviceInfo ) {
  if ( _.isUndefined( deviceInfo.userId && deviceInfo.deviceId )){
    return new Error('Invalid device information passed' + JSON.parse(deviceInfo));
  }

  return [deviceInfo.userId, deviceInfo.deviceId ].join('/');
}

function getUserBase( userInfo ){
  return __pathBase( __getUserPath(userInfo) );
}

// for completeness sake
function __getUserPath( userInfo ) {
  return userInfo;
}

 function __lookupApp( appInfo, name ) {
}
