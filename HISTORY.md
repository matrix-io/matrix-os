# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.10.0]
Queue the magic.
### Added
- Bluetooth Support for Pairing Workflow(!!)
- Save credentials to device database
- Binary script in `bin/` for local reset

# Changed 
- Login sequence adapted to start with bluetooth pair if no id/secret
- New Pretty Loader

## [0.9.0]
### Added
- Zigbee Support
- Passing image buffers to apps
- Docker virtualization for apps ( uses DOCKER_APPS flag for now )
- Wifi Support
- Basic Python implementation
- Distinct sensor support for gyroscope, accelerometer, and magnetometer
- Adding images to detection payload
- Message in case of no device id / secret

### Changed
- Prevent apps that fail on init from being added to activeApplications
- Stopped restart on config change, will require manual restart now

### Fixed
- Removed application folder on uninstall
- Tests work again

## [0.7.0]
### Added
- Enable servo write
- Enable GPIO Read / write
- Add testing and Travis

### Removed
- More test applications
- appapi test file

## [0.6.4]

### Added
- NO_INSTALL flag to skip new installs, cli tests
- 'matrix-ready' IPC event for cli tests
- Error checking for upgrades

### Changed
- Prevent multiple kill signals

## [0.6.3]

### Added
- Mic basics
- Support application updates


## [0.6.2]
### Added
- Added stubs for GPIO, IR and Microphone
- Basic Microphone data coming in (needs work)
- Restart application if configuration changes
- Clear app status on device exit
- Check for existence before starting app

### Changed
- Stop crash if app folder doesn't exist on start
- Stop app on uninstall / install / deploy


## [0.6.1]


### Changed
Set app status to inactive on boot

## [0.6.0]
### Added
- gesture driver
- detection driver
- service for integrations
- component test

### Removed
- face driver

### Changed
- face goes through detection driver
- Start versioning history
- Deployment improvements
- Firebase improvements

## [0.5.12]
Fixed and sped up heart beat
Enabled `SUN_MODE` to use white leds from `matrix.led`. Will be useful when the lights are covered.
Enable gestures `matrix.init('thumb-up')`

## [0.5.11]
Improve event filter handling
Add eventfilter to upgrade
Exit after dependency upgrade

## [0.5.10]
Rearrange starting init to prioritize the upgrade check after API


## [0.5.9]
More deployment fixes
Upgrade version skips for testing

## [0.5.6]
Fix deploy issues
Upgrade matrix and Dependencies

## [0.5.4]
### Added
* Support Upgrade Checking
* Support Application install on Init
* Start History
