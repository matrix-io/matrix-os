module.exports = {
  init: {
    Matrix.events.on('service-init', Matrix.device.service.handler )
  }
}
