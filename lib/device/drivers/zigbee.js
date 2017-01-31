var protoBuilder, matrixMalosBuilder, driverConfig;

var debug = debugLog('zigbee');


var zigbee_network_up = false
var gateway_up = false
var attemps = 10
var device_detected = false



var nodes_id = []
var endpoints_index = []

var knownBulbs = new Set();

var cmds = {
}

var params = {}

var config = {}

var enums = {

}

var NetCmd = {
  check: function(){
    cmds.netManage.set_type( enums.netTypes.IS_PROXY_ACTIVE );
    cmds.msg.network_mgmt_cmd = cmds.netManage;
    cmds.msg.type = enums.zbCmdTypes.NETWORK_MGMT;
    // debug('check', require('util').inspect(config.base));
    debug('network check'.green)
    Matrix.components.zigbee.print(config.base.encode().toBuffer());
  },
  reset: function(){
    cmds.msg.set_type( enums.zbCmdTypes.NETWORK_MGMT );
    cmds.netManage.set_type( enums.netTypes.RESET_PROXY );
    cmds.msg.network_mgmt_cmd = cmds.netManage;
    // debug('reset', config.base);
    debug('Zigbee Reset'.green)
    Matrix.components.zigbee.print(config.base.encode().toBuffer());
  },
  status: function(){
    cmds.msg.set_type( enums.zbCmdTypes.NETWORK_MGMT );
    cmds.netManage.set_type( enums.netTypes.NETWORK_STATUS );
    cmds.msg.network_mgmt_cmd = cmds.netManage;
  // debug(config.base)
    debug('-> Network Status')
    Matrix.components.zigbee.print(config.base.encode().toBuffer());
  },
  permitJoin: function(){
    cmds.msg.set_type( enums.zbCmdTypes.NETWORK_MGMT );
    cmds.netManage.set_type( enums.netTypes.PERMIT_JOIN );
    params.permitJoin.time = 60;
    cmds.netManage.permit_join_params = params.permitJoin; 
    cmds.msg.network_mgmt_cmd = cmds.netManage;

    debug(config.base)
    debug('-> Permit Join')
    Matrix.components.zigbee.print(config.base.encode().toBuffer());

  }
}

module.exports = {

  // init runs automatically, wait for app to request component creation
  init: function(){
    protoBuilder = Matrix.service.protobuf.malos.driver;
    // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos')
    driverConfig = new matrixMalosBuilder.DriverConfig;
    // TODO: Manage in case of multiple apps using zigbee

    // SETUP REFERENCES
    // all malos commands need to be via this protobuf
    config.base = new matrixMalosBuilder.DriverConfig;
    config.base.timeout_after_last_ping = 1;
    config.base.delay_between_updates = 1;


    cmds.msg = new matrixMalosBuilder.ZigBeeMsg
    cmds.netManage = new matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd
    cmds.zcl = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd
    cmds.id = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.IdentifyCmd
    cmds.onoff = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.OnOffCmd
    cmds.colorcontrol = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd

    params.movetohue = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd.MoveToHueCmdParams
    params.movetohueandsat = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd.MoveToHueAndSatCmdParams
    params.movetosat = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd.MoveToHueCmdParams
    params.permitJoin = new matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.PermitJoinParams;

    enums.netStatus = matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkStatus.Status;
    enums.netTypes = matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes;
    enums.zbCmdTypes = matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType;
    enums.idCmdTypes = matrixMalosBuilder.ZigBeeMsg.ZCLCmd.IdentifyCmd.ZCLIdentifyCmdType;
    enums.mdTypes = matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType;
    enums.onOff = matrixMalosBuilder.ZigBeeMsg.ZCLCmd.OnOffCmd.ZCLOnOffCmdType;
    enums.zclCmdTypes = matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ZCLCmdType;

    // attach message to driver
    config.base.zigbee_message = cmds.msg;

    // Automatically Activate for Now
    module.exports.activate( () => {
      config.base.delay_between_updates = 0;
      config.base.timeout_after_last_ping = 0;
      NetCmd.reset();
      NetCmd.check();
      // BulbCmd.toggle();
      debug('activate done')
    })


},
reset: module.exports.init,

// Need to have activation script independent of /drivers
// Maybe this is the next step for all drivers?
activate: function(cb){
  // fetches the zero mq connections in a keyed object { config, update, ping... }
  var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers['zigbee']);

  // put connections in options for component - swap options name and type
  var options = _.assign({name: 'zigbee'}, mqs);

  // construct with component Class
  var c = new Matrix.service.component(options);
  console.log(enums)
  c.read((d) => { console.log('D', d)})

  c.send({ timeout: 15, refresh: 1 }, cb);
  c.error((d) => { console.log(d)});

  // todo, move this to heartbeat
  setInterval(function() { c.ping(''); }, 1000);

},
// Figure out how to decode different zb messages and route them back into the application.
// Will have to handle again elsewhere.
read: function(buffer){
  console.log('.read>', buffer );
  var zbMsg = new matrixMalosBuilder.ZigBeeMsg.decode(buffer);
  debug(zbMsg)
  // type switch - first level
  if (zbMsg.type === enums.zbCmdTypes.ZCL){
    ///
  } else if (enums.zbCmdTypes.NETWORK_MGMT){
    var netCmd = zbMsg.network_mgmt_cmd;
    var netCmdType = netCmd.type;
    debug('NET:', netCmdType);
    if ( netCmdType === 'IS_PROXY_ACTIVE' ){
      if ( zbMsg.network_mgmt_cmd.is_proxy_active ){
        debug('Gateway Active')
      } else {
        return console.error('Zigbee Gateway Error')
      }
      NetCmd.status();
    } else if (netCmdType ==='NETWORK_STATUS'){
      var status = netCmd.network_status.type;
      debug('STATUS:', status);
      if ( status === 'JOINED_NETWORK'){
        NetCmd.permitJoin();
      } else if (status === 'JOINING_NETWORK'){
      } else if (status === 'NO_NETWORK'){
      } else if (status === 'JOINED_NETWORK_NO_PARENT'){
      } else if (status === 'LEAVING_NETWORK'){
      }
      //# end networks status
    }
    //#end network management
  } else {
    warn('Unhandled Zigbee Message')
  }
  // try {
  //   var a = new matrixMalosBuilder.ZigBeeAnnounce.decode(buffer);
  //   if ( _.isUndefined(a)) return;
  //   debug('Announce>', a);
  //   knownBulbs.push( { id: a.short_id, cluster: a.cluster_id, cmd: a.zdo_command, status: a.zdo_status } );
  //   debug('Adding Bulb # ${ knownBulbs.length } id: ${ a.short_id }'.green);
  //   //TODO: Emit zb-announce message for app layer
  //   return a;
  // } catch (e){
  //   log(' Announce Error ', e );
  // }


  // var zm = new matrixMalosBuilder.ZigBeeMsg.decode(buffer)
  //
  //
  //
// ?    handleNetworkCommand(zm);


  // return zm;

    // var detect = new matrixVisionMalosBuilder.VisionResult.decode(buffer).toRaw();
    //
    // // unlike other sensors, this one is a collection
    // return _.map(detect.rect_detection, (d) => {
    //   return {
    //     detection: d.tag,
    //     recognition: d.facial_recognition
    //   }
    // });
  },

  // components.send pushes proto through prepare
  prepare: function(options, cb){
    if (_.isFunction(options)){
      cb = options;
      options = {};
    }
    if (_.isUndefined(options)){
      options = {};
    }

    if ( !_.has(options, 'msg')){
      // map to new zbmsg
      options.msg = cmds.msg;
    }

    if ( !_.has(options, 'refresh')){
      options.refresh = 1.0;
    }
    if ( !_.has(options, 'timeout')){
      options.timeout = 10.0;
    }

    // 2 seconds between updates.
    config.base.set_delay_between_updates(options.refresh);
    config.base.set_timeout_after_last_ping(options.timeout);

    if ( _.has(options, 'msg')){
      config.base.set_zigbee_message( options.msg );
    }

    debug('prepare->', config)
    cb(config.base.encode().toBuffer());
  },
  ping: function(){
    if ( _.has(Matrix.components, 'zigbee')){
      Matrix.components.zigbee.ping();
    } else {
      console.error('No Zigbee Component Available for Ping')
      console.error('Components:',Matrix.components);
    }
  },
  error: function(err){
    console.error('Error', err.toString());
  },
  /// * FOR LIGHTS
  on: function(){
    makeBulbCmd('on');
  },
  off: function(){
    makeBulbCmd('off');
  },
  handleLight: function(msg){
    if ( msg.type !== 'zigbee-light-cmd' ){
      return console.error('Invalid Light command sent to zigbee driver')
    }
    makeBulbCmd( msg.cmd, msg.payload )
  },
}

function handleNetworkCommand(zbMsg){
    debug('Network Command Message', zbMsg );

    // status
    var none = 0
    var status;
    var STATUS = {
      NONE: 0,
      WAITING_FOR_DEVICES: 1,
      WAITING_FOR_NETWORK_STATUS: 2,
      NODES_DISCOVERED: 3
    }

      switch(zbMsg.network_mgmt_cmd.type){
        case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.CREATE_NWK:
          console.log('CREATE_NWK');
        break;
        case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.LEAVE_NWK:
          console.log('LEAVE_NWK');
        break;
        case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.NODE_LEAVE_NWK:
          console.log('NODE_LEAVE_NWK');
        break;
        case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.PERMIT_JOIN:
          console.log('PERMIT_JOIN');
        break;
        case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.NODE_INFO:
          console.log('NODE_INFO');
        break;
        case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.DISCOVERY_INFO:

          if (status === status.WAITING_FOR_DEVICES) {
            // Looking  for nodes that have an on-off cluster
            console.log('Device(s) found!!!');
            console.log('Looking for nodes that have an on-off cluster.');
            for (var i = 0; i < zbMsg.network_mgmt_cmd.connected_nodes.length; i++) {
              for (var j = 0; j < zbMsg.network_mgmt_cmd.connected_nodes[i].endpoints.length; j++) {
                for (var k = 0; k < zbMsg.network_mgmt_cmd.connected_nodes[i].endpoints[j].clusters.length; k++) {
                  // Adding just nodes with  On/Off cluster
                  if (zbMsg.network_mgmt_cmd.connected_nodes[i].endpoints[j].clusters[k].cluster_id === 6) {
                    // saving the node_id
                    nodes_id.push(zbMsg.network_mgmt_cmd.connected_nodes[i].node_id)
                    // saving the endpoint_index
                    endpoints_index.push(zbMsg.network_mgmt_cmd.connected_nodes[i].endpoints[j].endpoint_index)
                    continue;
                  }
                }
              }
            }

           if(nodes_id.length > 0){
            status = nodes_discovered
            debug( nodes_id.length  + ' nodes found with on-off cluster\n');
           } else {
            status = STATUS.NONE;
            debig('No devices found !');
           }
           // Start toggling the nodes
           ToggleNodes();
          }

          break;
        case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.RESET_PROXY:
          // console.log('RESET_PROXY');
        break;
        case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.IS_PROXY_ACTIVE:

          if (zbMsg.network_mgmt_cmd.is_proxy_active){
            console.log('Gateway connected');
            gateway_up = true; //zbMsg.network_mgmt_cmd.is_proxy_activee;
          } else {
            console.log('Gateway Reset Failed.');
            process.exit(1);
          }
          console.log('Requesting ZigBee Network Status');
          config.zigbee_message.network_mgmt_cmd.set_type(
            matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.NETWORK_STATUS)
          configSocket.send(config.encode().toBuffer());
          status = waiting_for_network_status;
        break;
        case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.NETWORK_STATUS:

          if (status != waiting_for_network_status) {
            break;
          }

          debug('NETWORK_STATUS: ')

          status = none;

          switch(zbMsg.network_mgmt_cmd.network_status.type) {
            case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkStatus.Status.NO_NETWORK:
              console.log('NO_NETWORK');
              console.log('Creating a ZigBee Network');
              config.zigbee_message.network_mgmt_cmd.set_type(
                matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.CREATE_NWK)
              configSocket.send(config.encode().toBuffer());
              status = waiting_for_network_status;
            break;
            case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkStatus.Status.JOINING_NETWORK:
              console.log('JOINING_NETWORK');
            break;
            case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkStatus.Status.JOINED_NETWORK:
              console.log('JOINED_NETWORK');
              config.zigbee_message.network_mgmt_cmd.set_type(
              matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.PERMIT_JOIN);

              // Send a permit join commnad
              var permit_join_params = new matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.PermitJoinParams;
              permit_join_params.setTime(60);
              config.zigbee_message.network_mgmt_cmd.set_permit_join_params(permit_join_params);

              configSocket.send(config.encode().toBuffer());

              console.log('Please reset your zigbee devices');
              console.log('... Waiting 60 sec for new devices');
              status = waiting_for_devices
            break;
            case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkStatus.Status.JOINED_NETWORK_NO_PARENT:
              console.log('JOINED_NETWORK_NO_PARENT');
            break;
            case matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkStatus.Status.LEAVING_NETWORK:
              console.log('LEAVING_NETWORK');
            break;
          }

        break;
      }


}



function resetGateway(){
  // ------- Setting the delay_between_updates and set_timeout_after_last_ping ---------
  console.log('Setting the Zigbee Driver');
  config.base.set_delay_between_updates(1)
  config.base.set_timeout_after_last_ping(1)

  // If no zigbee component active, then stop this reset.
  if ( !Matrix.components.hasOwnProperty('zigbee') ){
    return;
  }

  // ------------ Creating the base proto zigbee message -----------------------
  config = new matrixMalosBuilder.DriverConfig

  var zig_msg = new matrixMalosBuilder.ZigBeeMsg
  var network_mgmt_cmd = new matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd
  var zcl_cmd = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd
  var onoff_cmd = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.OnOffCmd
  var colorcontrol_cmd = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd
  var movetohueandsat_params = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd.MoveToHueAndSatCmdParams


  zig_msg.set_zcl_cmd(zcl_cmd)
  zig_msg.zcl_cmd.set_onoff_cmd(onoff_cmd)
  zig_msg.zcl_cmd.set_colorcontrol_cmd(colorcontrol_cmd)
  zig_msg.zcl_cmd.colorcontrol_cmd.set_movetohueandsat_params(movetohueandsat_params);
  zig_msg.set_network_mgmt_cmd(network_mgmt_cmd)
  config.set_zigbee_message(zig_msg)

  // ------------ Reseting the Gateway App -----------------------
  console.log('Reseting the Gateway App');
  config.zigbee_message.set_type(matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType.NETWORK_MGMT);
  config.zigbee_message.network_mgmt_cmd.set_type(
    matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.RESET_PROXY)
  Matrix.components.zigbee.print.send(config.encode().toBuffer());

  // ------------ Checking connection with the Gateway ----------------------
  console.log('Checking connection with the Gateway');
  config.zigbee_message.network_mgmt_cmd.set_type(
    matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes.IS_PROXY_ACTIVE)
  Matrix.components.zigbee.print.send(config.encode().toBuffer());

}

function ToggleNodes(){
  if (status === STATUS.NODES_DISCOVERED) return;
  config.zigbee_message.set_type(matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType.ZCL);
  config.zigbee_message.zcl_cmd.set_type(matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ZCLCmdType.ON_OFF);
  config.zigbee_message.zcl_cmd.onoff_cmd.set_type(matrixMalosBuilder.ZigBeeMsg.ZCLCmd.OnOffCmd.ZCLOnOffCmdType.TOGGLE);

  setInterval(function(){

    // Color
    // var color = parseInt( (180 + math.atan2(imuData.roll, imuData.pitch) * 180 / math.PI).toString());

    // config.zigbee_message.zcl_cmd.colorcontrol_cmd.movetohueandsat_params.set_hue(color);
    // config.zigbee_message.zcl_cmd.colorcontrol_cmd.movetohueandsat_params.set_saturation(254);
    // config.zigbee_message.zcl_cmd.colorcontrol_cmd.movetohueandsat_params.set_transition_time(0);

    // debug('IMU: ' + imuData.pitch + '|' + imuData.roll + ' Color: ' + color + '\n')

    for (var i = 0; i < nodes_id.length; i++) {
      debug('Sending toggle to Node: ', nodes_id[i]);
      config.zigbee_message.zcl_cmd.set_node_id(nodes_id[i]);
      config.zigbee_message.zcl_cmd.set_endpoint_index(endpoints_index[i]);
      Matrix.components.zigbee.print(config.encode().toBuffer());
    }
  }, 2000);
}


/*Node Count: 1
Node Index: 1
  NodeId: 0xB592
  Eui64: 0xC000060201881700
  EP: 11
  Profile ID: 0xC05E
    Device ID: 0x0210
    Clusters Count: 9
      Cluster: 0x0019 Client
      Cluster: 0x0000 Server
      Cluster: 0x0003 Server
      Cluster: 0x0004 Server
      Cluster: 0x0005 Server
      Cluster: 0x0006 Server
      Cluster: 0x0008 Server
      Cluster: 0x0300 Server
      Cluster: 0x1000 Server
  EP: 242
  Profile ID: 0xA1E0
    Device ID: 0x0061
    Clusters Count: 2
      Cluster: 0x0021 Client
      Cluster: 0x0021 Server
      */
