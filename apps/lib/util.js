

module.exports = {
/**
 * Is this application configured for this event?
 * @param {string} ev - event name to test for
 * @return {Boolean} - is in the config
 */
hasEvent: (ev) => {
  return ( matrix.config.hasOwnProperty('events') &&
      matrix.config.events.indexOf(ev) > -1 )
  }
}