# MATRIX Device Container Kit


### Debugging

Use `DEBUG=* nodemon` to see all debug messages.

#### Debug categories

` app, sensor, stream, matrix `

**example:**
To see output from socket streams and apps, do
`DEBUG=app,stream nodemon`

To exclude engine-io from the output, do
`DEBUG=*,-engine* nodemon`

## Environment Variables
```
ADMATRIX_API_SERVER http://dev-demo.admobilize.com -- points to admobilize-api server
ADMATRIX_STREAMING_SERVER http://localhost:3000 - points to admatrix-streaming-server, deploy with convox
ADMATRIX_CLIENT_ID AdMobilizeClientID - assigned id
ADMATRIX_CLIENT_SECRET AdMobilizeClientSecret - assigned secret
ADMATRIX_USER - brian@rokk3rlabs.com - user to login with
ADMATRIX_PASSWORD - Trudat55
```

## Freescale Installation
```
# from local admatrix parent folder
zip -r admatrix.zip admatrix/ -x *.git*
scp admatrix.zip admatrix@192.168.1.129:~/

# on device
unzip admatrix.zip -d admatrix

npm install -g node-gyp nodemon
```

## Raspberry Pi Installation
```
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
sudo apt-get install libasound2-dev
```

## Rebuilds node-gyp

```
cd node_modules/adsensors && node-gyp rebuild
cd ../ && npm rebuild
```

## Start your Application with a Test App

```
ADMATRIX_SENSOR_REFRESH=500 START_APP=test nodemon
```

## Permission Fixes for Audio & Sensors

```
# Audio Playback Fix for Sudo
apt-get install jackd2
sudo chmod 666 /sys/class/input/input4/enable

# Accelerometer Permissions
sudo chmod 666 /sys/class/input/input4/enable
sudo usermod -a -G input admatrix

# Magnometer Permissions
sudo usermod -a -G i2c admatrix

# Altimeter Permissions
sudo chmod 777 /dev/spidev0.0

# Install Sox For Linux
sudo apt-get install sox libsox-fmt-all

# Install Sox for mac
brew install sox

```

## Prerequisite - AdSensors

* Clone admobilize-adsensor repo
* Copy admobilize-adsensor/node-adsensors/ contents into admatrix/node_modules/adsensors
* `npm install` in admatrix/

## MATRIX File System
```
Matrix
|_device  - Everything having to do with the device
| |_bluetooth          - ( init, createCharacteristic, createService )
| |_daemon             - Start / Kill Processes ( Not Intended for Apps )
| |_file               - File Reading / Writing Utilities
| |_storage            - ( freespace(cb) ) Determine device storage capacity
| |_wifi               - ( init )
|_event  - Events are mainly for routing requests to services
| |_api-socket-router  - Handle Messages To/From API
| |_app-functional     - Handle Messages / Data from App
| |_app-lifecycle      - Handle on, off, update, etc. messages from API
| |_heartbeat          - Emitted on regular interval
| |_sensors            - Listeners, Socket Server & Multi-Sensor Management
| |_token              - Refresh Token Event
| |_util               - Nothing yet
|_service
| |_auth               - ( authenticate ) refresh tokenss
| |_filter             - (todo) Server side filtering + Database
| |_heartbeat          - Actual Heartbeat Process
| |_initialize         - Old Beacon Init
| |_lifecycle          - Keeps track of last boot
| |_logging            - See Custom Global Functions
| |_manager            - App Management ( start, stop, install )
| |_media              - Video / Image from Beacon
| |_stream             - Connect with streaming server
| |_token              - Persist / Retrieve Token
```

## Events
(See)[https://docs.google.com/spreadsheets/d/131aFIKZRKLm8fIlFbYi-AnroEXMSJvxtpyujY18zcHk/edit?usp=sharing]


## Developer Help

Custom global functions

```
clog() - console.log shortcut, no logentries
ulog() - utility log, pretty prints object, no Logentries
log() - logentries
warn() - logentries
error() - logentries
```