Matrix.
  init - initialize sensor
  send - send sensor data to infrastructure
  emit - send other data to infrastructure
  receive - general message handling
  notify - kick off inter app messaging
    global `notify(msg)`
    specific `notify(appName, msg)`
    specific-eventname `notify(appName, eventName, msg)`
  on - handle inter app messaging
    global & app specific `on(cb)`
    specific event name `on(eventName, cb)`
  debug - set to true to turn on debugging
