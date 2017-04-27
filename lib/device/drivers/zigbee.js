var protoBuilder, matrixMalosBuilder, driverConfig, ZB, Cmd;

var debug = debugLog('zigbee');

var activated = false;

var knownBulbs = new Set();

var cmds = {};

var params = {};

var config = {};

var enums = {

};

function lookForBulbs(nodes) {
  var onoffs = _.filter(nodes, function(n) {
    return _.find(n.endpoints, function(e) {
      return _.find(e.clusters, function(c) {
        return (c.cluster_id === 6);
      });
    });
  });

  var levels = _.filter(nodes, function(n) {
    return _.find(n.endpoints, function(e) {
      return _.find(e.clusters, function(c) {
        return (c.cluster_id === 8);
      });
    });
  });

  var colors = _.filter(nodes, function(n) {
    return _.find(n.endpoints, function(e) {
      return _.find(e.clusters, function(c) {
        return (c.cluster_id === 768);
      });
    });
  });


  var onoffIds = _.map(onoffs, 'node_id');
  var onoffEndpoints = _.map(onoffs, function(n) {
    return _.map(n.endpoints, 'endpoint_index');
  })[0];
  var levelIds = _.map(levels, 'node_id');
  var colorIds = _.map(colors, 'node_id');
  console.log('>>>ONOFF<<<', onoffIds, onoffs);
  console.log('>>>LEVEL<<<', levelIds, levels);
  console.log('>>>COLOR<<<', colorIds, colors);

  knownBulbs.add([onoffIds[0], onoffEndpoints[0]]);
}


module.exports = {

  // init runs automatically, wait for app to request component creation
  init: function() {

    protoBuilder = Matrix.service.protobuf.malos.driver;
    // Parse matrix_malos package (namespace).
    matrixMalosBuilder = protoBuilder.build('matrix_malos');

    // Command Constructor
    ZB = function() {
      // start from fresh object
      var self = this;
      self.config = new matrixMalosBuilder.DriverConfig;

      var cmds = {};
      cmds.msg = new matrixMalosBuilder.ZigBeeMsg;
      cmds.net = new matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd;
      cmds.zcl = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd;
      cmds.id = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.IdentifyCmd;
      cmds.onoff = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.OnOffCmd;
      cmds.level = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.LevelCmd;
      cmds.colorcontrol = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd;

      var params = {};
      params.movetohue = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd.MoveToHueCmdParams;
      params.movetolevel = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.LevelCmd.MoveToLevelCmdParams;
      params.movelevel = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.LevelCmd.MoveCmdParams;
      params.movetohueandsat = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd.MoveToHueAndSatCmdParams;
      params.movetosat = new matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ColorControlCmd.MoveToHueCmdParams;
      params.permitJoin = new matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.PermitJoinParams;

      // enums need to be referenced outside of ZB
      enums.netStatus = matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkStatus.Status;
      enums.netTypes = matrixMalosBuilder.ZigBeeMsg.NetworkMgmtCmd.NetworkMgmtCmdTypes;
      enums.zbCmdTypes = matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType;
      enums.idCmdTypes = matrixMalosBuilder.ZigBeeMsg.ZCLCmd.IdentifyCmd.ZCLIdentifyCmdType;
      enums.mdTypes = matrixMalosBuilder.ZigBeeMsg.ZigBeeCmdType;
      enums.onoff = matrixMalosBuilder.ZigBeeMsg.ZCLCmd.OnOffCmd.ZCLOnOffCmdType;
      enums.level = matrixMalosBuilder.ZigBeeMsg.ZCLCmd.LevelCmd.ZCLLevelCmdType;
      enums.zclCmdTypes = matrixMalosBuilder.ZigBeeMsg.ZCLCmd.ZCLCmdType;

      self.errors = [];

      // indicate a device. takes index for now. use object later
      self.device = function(i) {
        var i = i || 0;
        var bulbs = Array.from(knownBulbs);
        if (bulbs.length === 0) {
          self.errors.push('No devices found');
        } else {
          var node = Array.from(knownBulbs)[i][0];
          var endpoint = Array.from(knownBulbs)[i][1];
          cmds.zcl.node_id = node;
          cmds.zcl.endpoint_index = endpoint;
        }
        return self;
      };


      // init
      var config = self.config;

      // LEVEL 1
      self.init = function(timeout, delay) {
        config.timeout_after_last_ping = timeout || 15;
        config.delay_between_updates = delay || 1;
        __send();
      };

      // Private Methods -
      // LEVEL 1 Assignments
      const __send = function() {
        config.zigbee_message = cmds.msg;
        if (activated && self.errors.length === 0) {
            debug(require('util').inspect(config, { depth: null }));
            Matrix.components.zigbee.print(config.encode().toBuffer());
          } else if (self.errors.length > 0) {
            console.error('Zigbee Command Errors:\n'.red, '->', self.errors.join('\n -> '.red));
          } else {
            console.error('Zigbee Command Print Failed due to Component Inactivation');
          }
          // reset command state
        Cmd = new ZB();
      };
        //
        // LEVEL 2 Assignments
      const __net = function() {
        cmds.msg.network_mgmt_cmd = cmds.net;
        cmds.msg.type = enums.zbCmdTypes.NETWORK_MGMT;
        __send();
      };

      const __zcl = function() {
        if (_.isUndefined(cmds.zcl.node_id) || _.isUndefined(cmds.zcl.endpoint_index)) {
          self.errors.push('No Node ID and/or Endpoint ID set');
        }
        cmds.msg.zcl_cmd = cmds.zcl;
        cmds.msg.type = enums.zbCmdTypes.ZCL;
        __send();
      };


      // LEVEL 3 ZCL Assignments
      const __onoff = function() {
        cmds.zcl.type = enums.zclCmdTypes.ON_OFF;
        cmds.zcl.onoff_cmd = cmds.onoff;
        __zcl();
      };

      const __level = function() {
        cmds.zcl.type = enums.zclCmdTypes.LEVEL;
        cmds.zcl.level_cmd = cmds.level;
        __zcl();
      };

      const __color = function() {
        cmds.zcl.type = enums.zclCmdTypes.COLOR_CONTROL;
        cmds.zcl.colorcontrol_cmd = cmds.colorcontrol;
        __zcl();
      };


      self.on = function() {
        cmds.onoff.type = enums.onoff.ON;
        __onoff();
      };

      self.off = function() {
        cmds.onoff.type = enums.onoff.OFF;
        __onoff();
      };

      self.toggle = function() {
        cmds.onoff.type = enums.onoff.TOGGLE;
        __onoff();
      };


      /**
       * moves light to level over time
       * @param  {int32} level what level to target
       * @param  {int32} time  how long to take in seconds
       */
      self.movetolevel = function(level, time) {
        params.movetolevel.level = level;
        params.movetolevel.transition_time = time;
        cmds.level.move_to_level_params = params.movetolevel;
        cmds.level.type = enums.level.MOVE_TO_LEVEL;
        __level();
      };

      /**
       * move over time
       * @param  {boolean} up   true = fade in false = fade out
       * @param  {int32} rate   how many units per second 1-255
       */
      self.movelevel = function(up, rate) {
        params.movelevel.mode = (up) ? 0 : 1;
        params.movelevel.rate = rate;
        cmds.level.move_params = params.movelevel;
        cmds.level.type = enums.level.MOVE;
        __level();
      };


      /**
       * move light to a hue. uses shortest_distance. see protobuf for more options
       * @param  {[type]} hue  [description]
       * @param  {[type]} time [description]
       * @return {[type]}      [description]
       */
      self.movetohue = function(hue, time) {
        params.movetohue.hue = hue;
        params.movetohue.direction = 0;
        params.movetohue.transition_time = time;
        cmds.colorcontrol.movetohue_params = params.movetohue;
        __color();
      };

      // TODO
      self.movetosat = function() {};
      self.movetohueandsat = function() {};

      self.check = function() {
        cmds.net.type = enums.netTypes.IS_PROXY_ACTIVE;
        __net();
      };

      self.reset = function() {
        cmds.net.set_type(enums.netTypes.RESET_PROXY);
        __net();
      };

      self.status = function() {
        cmds.net.set_type(enums.netTypes.NETWORK_STATUS);
        __net();
      };

      self.permitJoin = function() {
        cmds.net.set_type(enums.netTypes.PERMIT_JOIN);
        params.permitJoin.time = 60;
        cmds.net.permit_join_params = params.permitJoin;
        __net();
      };

      self.discovery = function() {
        cmds.net.type = enums.netTypes.DISCOVERY_INFO;
        __net();
      };

      self.create = function() {
        cmds.net.type = enums.netTypes.CREATE_NWK;
        __net();
      };

      self.leave = function() {
        cmds.net.type = enums.netTypes.LEAVE_NWK;
        __net();
      };

      self.askLeave = function(node) {
        if (_.isUndefined(node)) {
          self.errors.push('No Node Defined to Ask To Leave');
        }
        cmds.net.type = enums.netTypes.NODE_LEAVE_NWK;
        params.nodeLeave.node_id = node;
        cmds.net.node_leave_params = params.nodeLeave;
        __net();
      };

      return self;
    };

    // Instance of Above Command Contructor = Use this.
    Cmd = new ZB();
  },
  reset: module.exports.init,

  // Need to have activation script independent of /drivers
  // Maybe this is the next step for all drivers?
  activate: function() {
    if (!activated) {

      // fetches the zero mq connections in a keyed object { config, update, ping... }
      var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers['zigbee']);

      // put connections in options for component - swap options name and type
      var options = _.assign({ name: 'zigbee' }, mqs);

      // construct with component Class
      var c = new Matrix.service.component(options);
      c.read((d) => { console.log('D', d); });
      c.error((d) => { console.log(d); });

      activated = true;
      Cmd.init(1, 1);

      Cmd.reset();
      Cmd.check();
      debug('activate done');

      // todo, move this to heartbeat
      setInterval(function() { c.ping(''); }, 1000);

    }
  },
  // Figure out how to decode different zb messages and route them back into the application.
  // Will have to handle again elsewhere.
  read: function(buffer) {
    console.log('.read>', buffer);
    var zbMsg = new matrixMalosBuilder.ZigBeeMsg.decode(buffer);
    debug(require('util').inspect(zbMsg, { depth: null }));
      // type switch - first level
    if (zbMsg.type === enums.zbCmdTypes.ZCL) {
      ///
    } else if (enums.zbCmdTypes.NETWORK_MGMT) {
      var netCmd = zbMsg.network_mgmt_cmd;
      var netCmdType = netCmd.type;
      debug('NET:', netCmdType);

      if (!_.isEmpty(netCmd.connected_nodes)) {

        lookForBulbs(netCmd.connected_nodes);

      }

      if (netCmdType === 'IS_PROXY_ACTIVE') {
        if (zbMsg.network_mgmt_cmd.is_proxy_active) {
          debug('Gateway Active');
        } else {
          return console.error('Zigbee Gateway Error');
        }
        Cmd.status();
      } else if (netCmdType === 'NETWORK_STATUS') {
        var status = netCmd.network_status.type;
        debug('STATUS:', status);
        if (status === 'JOINED_NETWORK') {
          // NetCmd.permitJoin();
        } else if (status === 'JOINING_NETWORK') {} else if (status === 'NO_NETWORK') {
          debug('No ZigBee Network'.red);
          Cmd.create();
        } else if (status === 'JOINED_NETWORK_NO_PARENT') {} else if (status === 'LEAVING_NETWORK') {}
        //# end networks status
      } else if (netCmdType === 'DISCOVERY_INFO') {

        // netCmd.connectedNodes[].endpoints[].clusters[].cluster_id
        // 0 - information
        // 3 - identity ( flash on / off )
        // 6 - onoff
        // 8 - level control
        // 768 0x0300 - color control

        lookForBulbs(netCmd.connected_nodes);

      } else {
        warn('No Handler for net Cmd: ', netCmdType);
      }
      //#end network management
    } else {
      warn('Unhandled Zigbee Message');
    }
  },

  // components.send pushes proto through prepare
  prepare: function(options, cb) {
    if (_.isFunction(options)) {
      cb = options;
      options = {};
    }
    if (_.isUndefined(options)) {
      options = {};
    }

    if (!_.has(options, 'msg')) {
      // map to new zbmsg
      options.msg = cmds.msg;
    }

    if (!_.has(options, 'refresh')) {
      options.refresh = 1.0;
    }
    if (!_.has(options, 'timeout')) {
      options.timeout = 10.0;
    }

    // 2 seconds between updates.
    config.base.set_delay_between_updates(options.refresh);
    config.base.set_timeout_after_last_ping(options.timeout);

    if (_.has(options, 'msg')) {
      config.base.set_zigbee_message(options.msg);
    }

    debug('prepare->', config);
    cb(config.base.encode().toBuffer());
  },
  ping: function() {
    if (_.has(Matrix.components, 'zigbee')) {
      Matrix.components.zigbee.ping();
    } else {
      console.log('Zigbee available, not activated.');
    }
  },
  error: function(err) {
    console.error('Error', err.toString());
  },
  cmd: Cmd,
  spin: function() {
    Cmd.movehue();
  },

  /**
   * map light events from MOS to driver Cmd
   * @param  {event} d { type: 'zigbee-light-cmd', cmd: 'toggle' }
   */

  lightHandler: function(d) {
    debug(d);
    var p = d.payload;
    if (['on', 'off', 'toggle'].indexOf(d.cmd) === 0) {
      // maps right to methods
      Cmd.device()[d.cmd]();
    } else if (d.cmd.indexOf('color') !== -1) {
      if (d.cmd === 'color-set') {
        Cmd.device().movetohue(p.hue, p.time);
      } else if (d.cmd === 'color-move') {

      } else if (d.cmd === 'color-spin') {

      }
    } else if (d.cmd.indexOf('level') !== -1 || d.cmd.indexOf('fade') !== -1) {
      if (d.cmd === 'fade-on') {
        Cmd.device().movetolevel(255, p.time);
      } else if (d.cmd === 'fade-off') {
        Cmd.device().movetolevel(0, p.time);
      } else if (d.cmd === 'level-move') {
        Cmd.device().movetolevel(p.level, p.time);
      }
    }
  },

  netHandler: function(d) {
    debug(d);
    if (d.cmd === 'discover') {
      Cmd.permitJoin();
    } else if (d.cmd === 'reset') {
      Cmd.reset();
    } else if (d.cmd === 'status') {
      Cmd.status();
    }
  },
  //tmp
  toggle: function() {
    Cmd.device().toggle();
  }
};