# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).


## [Unreleased]
### Added
- gesture driver
- service for integrations

### Removed
- face driver

### Changed
- face goes through detection driver
- Start versioning history

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
