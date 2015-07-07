
module.exports = {
  registerDevice: function (device, cb) {

   var url    = config.settings.apiHost +  config.settings.registerDevicePath;
   var self = this;

   if(device.getUser()){
    require('getmac').getMac(function(err,macAddress){
     if (err) cb(new Error(err));

     device.setDeviceId(macAddress);

     params = {
       device_id: device.getDeviceId() ,
       access_token: device.getUser().getAccessToken(),
       name:  device.getName(),
       description : device.getDescription()
     };

     request.post({url:url, form:params}, function (err, response, body) {

      if(err) return cb(new Error('Server not responding:', err));

      console.log("body register " + body);

      var responseJSON;

      try{
        responseJSON = JSON.parse(body);
      }catch(error){
        cb(new Error("Error " + response.status))
      }


      if(responseJSON.status_code !== 200){
        //error
          if (responseJSON.error == "Token has expired") {
            console.log("Token has expired, user " + device.getUser().getUsername());
            self.authenticator.refreshUserToken(device.getUser(), function(err, responseJSON) {
              if (err) return cb(error);
                // try again
                self.registerDevice(device, cb);
              });
          } else {
            cb(new Error('Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);
          }
        } else {
          //success
        device.setDeviceToken(responseJSON.results['device_token']);
        cb(null, responseJSON);
      }

    });
});
}else{
  callback(new Error("This device is not associated to an user"));
}
},

   /*
   *@method  registerAnonymousDevice
   *@param  {Client} client
   *@param  {Devicie} device
   */

   registerAnonymousDevice: function(device, client, callback) {
    var url    = config.settings.apiHost + config.settings.registerAnonymousDevicePath;
    var self = this;

    require('getmac').getMac(function(err,macAddress){
     if (err)  throw err;
     device.setDeviceId(macAddress);
     params = {
       device_id: device.getDeviceId() ,
       client_token: client.getAccessToken(),
       name:  device.getName(),
       description : device.getDescription()
     };

     request.post({url:url, form:params}, function (error, response, body) {

      if(error){
        callback(new Error('Server not responding'),{});
        return;
      }
      var responseJSON = JSON.parse(body);
      if(responseJSON.status === 'OK'){
        device.setDeviceToken(responseJSON.results['device_token']);
        callback(null, responseJSON);
      }else{

        callback(new Error('Error ' + responseJSON.status_code + ' ' +responseJSON.error), responseJSON);


      }

    });
   } );
  }
  ,

  retrieveDeviceToken: function(device, client) {

   var url    = config.settings.apiHost + config.settings.retriveDeviceToken;

   params = {
       device_id: device.getDeviceId() ,
       client_token: client.getAccessToken(),
     };

   request.post({url:url, form:params}, function (error, response, body) {

    if(error){
      callback(new Error('Server not responding'),{});
      return;
    }

    var responseJSON;

    try{
      responseJSON = JSON.parse(body);
    }catch(error){
      callback(new Error("Error " + response.status))
    }

    if(responseJSON.status === 'OK'){
      device.setDeviceToken(responseJSON.results['device_token']);
      callback(null, responseJSON);
    }else{

      callback(new Error('Error ' + responseJSON.status_code + ' ' +responseJSON.error), responseJSON);

    }

  });
 }



  module.exports = {
    authenticate: authenticateDevice
  }