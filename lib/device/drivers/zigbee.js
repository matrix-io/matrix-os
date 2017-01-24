var protoBuilder, matrixMalosBuilder, driverConfig;

var debug = debugLog('zigbee');

var math = require("mathjs");
var sleep = require('sleep');
var time = require('time');


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

var types = {};

var config = {}

var enums = {

}


var ZigbeeBulbCmd = {
  on : function(){
    cmds.bulbCmd = new matrixMalosBuilder.zigbeeBulbCmd;
    cmds.bulbCmd.set_command(enums.bulbCmd.ON);
    cmds.bulbCmd.endpoint = 0xb;
    config.base.set_command(config.bulb.bulbCmd);
    config.base.set_zigbee_bulb(config.bulb);
    Matrix.components.zigbee.print(driverConfig);
  },
  off: function(){
    cmds.bulbCmd = new matrixMalosBuilder.zigbeeBulbCmd;
    cmds.bulbCmd.set_command(enums.bulbCmd.OFF);
    cmds.bulbCmd.endpoint = 0xb;
    config.base.set_command(config.bulb.bulbCmd);
    config.base.set_zigbee_bulb(config.bulb);
    Matrix.components.zigbee.print(driverConfig);

  },
  toggle: function(){
    // setup the command
    cmds.onoff.type = enums.onOff.TOGGLE;
    // attach to zcl msg
    cmds.zcl.type = enums.zclCmdTypes.ON_OFF;
    cmds.zcl.onoff_cmd = cmds.onoff;
    cmds.zcl.node_id = 0xB592 ;
    cmds.zcl.endpoint_index = 0x0B ;

    // attach czl to zbmsg
    cmds.msg.type  = enums.zbCmdTypes.ZCL;
    cmds.msg.zcl_cmd = cmds.zcl;

    // attach zcl to msg
    cmds.msg.zcl_cmd = cmds.zcl;

    config.base.zigbee_message = cmds.msg;
    console.log('>>>>>', config.base );

    Matrix.components.zigbee.print( config.base.encode().toBuffer() );
  },
  cmd: function(cmd){
    var zbbConfig = new config.zigbeeBulb;

    cmds.bulbCmd = new matrixMalosBuilder.zigbeeBulbCmd;
    cmds.bulbCmd.set_command(enums.bulbCmd[cmd.toUpperCase()]);
    cmds.bulbCmd.endpoint = 0xb;
    zbbConfig.set_command(cmds.bulbCmd);
    driverConfig.set_zigbee_bulb(zbbConfig);
    Matrix.components.zigbee.print(driverConfig);
  }

}

function makeBulbCmd(cmd, options){
  var command = cmd.bulbCmd;
  command.short_id = 6058;
  command.endpoint = 0xb;
  if ( cmd.match(/color-set|color-move|color-spin|fade-on|fade-off|level-move/)){
    // time
    var params;
    if (cmd === 'color-set'){
      params = new params.movetohue;
      // check for tc
      params.set_hue(options.color);
      //0x00 Shortest distance 0x01 Longest distance 0x02 Up 0x03 Down
      params.set_direction(0);
      params.set_transition_time = options.time;
    }
    command.set_params(params);
  } else if (enums.bulbCmd.hasOwnProperty(cmd)) {
    // for one offs
    command = cmds.bulbCmd.set_command(enums.bulbCmd[cmd.toUpperCase()])
  }
  config.bulb.set_command(command);
  config.base.set_zigbee_bulb(config.bulb);
  console.log(config.base);
  Matrix.components.zigbee.print(config.base.encode().toString());
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
    // include this and/or cmds.msg in above to send command
    config.bulb = new matrixMalosBuilder.ZigbeeBulbConfig;

    cmds.msg = new matrixMalosBuilder.ZigBeeMsg
    cmds.netManage = new matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd
    cmds.zcl = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd
    cmds.id = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.IdentifyCmd
    cmds.onoff = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.OnOffCmd
    cmds.colorcontrol = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd
    params.movetohue = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd.MoveToHueCmdParams
    params.movetohueandsat = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd.MoveToHueAndSatCmdParams
    params.movetosat = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd.MoveToHueCmdParams
    cmds.bulbCmd = new matrixMalosBuilder.ZigBeeBulbCmd;

    enums.bulbCmd = matrixMalosBuilder.ZigBeeBulbCmd.EnumCommands;
    enums.netStatus = matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkStatus.Status;
    enums.netTypes = matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes;
    enums.zbCmdTypes = matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType;
    enums.idCmdTypes = matrixMalosBuilder.ZigBeeMsg.ZCLCmd.IdentifyCmd.ZCLIdentifyCmdType;
    enums.mdTypes = matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType;
    enums.onOff = matrixMalosBuilder.ZigBeeMsg.ZCLCmd.OnOffCmd.ZCLOnOffCmdType;
    enums.zclCmdTypes = matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ZCLCmdType;

    config.bulb.set_address('127.0.0.1')
    config.bulb.set_port(31558)

    // Automatically Activate for Now
    module.exports.activate( () => {
      ZigbeeBulbCmd.toggle();
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

  // c.send({}, cb);
  cb();

},
// Figure out how to decode different zb messages and route them back into the application.
// Will have to handle again elsewhere.
read: function(buffer){
  console.log('zigbee>', buffer );
  try {
    var a = new matrixMalosBuilder.ZigBeeAnnounce.decode(buffer);
    if ( _.isUndefined(a)) return;
    debug('Announce>', a);
    knownBulbs.push( { id: a.short_id, cluster: a.cluster_id, cmd: a.zdo_command, status: a.zdo_status } );
    debug('Adding Bulb # ${ knownBulbs.length } id: ${ a.short_id }'.green);
    //TODO: Emit zb-announce message for app layer
    return a;
  } catch (e){
    log(' Announce Error ', e );
  }


  var zm = new matrixMalosBuilder.ZigBeeMsg.decode(buffer)

  if (zm.type === matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType.ZCL){
    debug('ZCL>', zm);
  } else if (zm.type === matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType.ZCL){
    debug('ZLL>', zm);
  } else if (matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType.NETWORK_MGMT){
    debug('NET>', zm);

    handleNetworkCommand(zm);

  } else {
    warn('Unhandled Zigbee Message')
  }

  return zm;

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

    // default to module setting if local is not available
    if ( !_.has(options, 'bulb')){
      // map to new bulb command
      options.bulb = config.bulb;
    }
    if ( !_.has(options, 'msg')){
      // map to new zbmsg
      options.msg = cmds.msg;
    }

    if ( !_.has(options, 'refresh')){
      options.refresh = 1.0;
    } else if ( parseFloat(options.refresh) === options.refresh ){
      options.refresh = options.refresh / 1000
    }
    if ( !_.has(options, 'timeout')){
      options.timeout = 10.0;
    } else if ( parseFloat(options.timeout) === options.timeout ){
        options.timeout = options.timeout / 1000
    }

    // 2 seconds between updates.
    config.base.set_delay_between_updates(options.refresh);
    config.base.set_timeout_after_last_ping(options.timeout);
    if ( _.has(options, 'bulb')){
      config.base.set_zigbee_bulb(options.bulb);
    }
    if ( _.has(options, 'msg')){
      config.base.set_zigbee_message( options.msg );
    }

    debug('zigbee start', config)
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
    console.error('Face', err);
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
  }
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
  Matrix.components.zigbee.print(config.bulb.encode().toBuffer());

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

function fn(){

var bulbCmd = new matrixMalosBuilder.ZigBeeBulbCmd
    bulbCmd.short_id = data.short_id
    // Check the message ZigBeeBulbCmd for the available commands.
    // https://github.com/matrix-io/protocol-buffers/blob/master/malos/driver.proto
    bulbCmd.command = matrixMalosBuilder.ZigBeeBulbCmd.EnumCommands.COLOR
    // Use 0xb for Philips bulbs. We haven't figured out how to use this parameter.
    bulbCmd.endpoint = 0xb
    // Params are: hue, saturation and transition time.
    bulbCmd.params.push(hue_and_sat, hue_and_sat, 1)
    console.log('hue_and_saturation ' + hue_and_sat)
    hue_and_sat += 50
    if (hue_and_sat > 255) {
        hue_and_sat = 0
    }
    var bulb_cfg_cmd = new matrixMalosBuilder.ZigbeeBulbConfig
    bulb_cfg_cmd.set_address('')
    bulb_cfg_cmd.set_port(-1)
    bulb_cfg_cmd.set_command(bulbCmd)

    var config = new matrixMalosBuilder.DriverConfig
    config.set_delay_between_updates(0.2)
    config.set_zigbee_bulb(bulb_cfg_cmd)
    configSocket.send(config.encode().toBuffer());

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
