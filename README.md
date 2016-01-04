# MATRIX Device Container Kit
*stay in wonderland and I show you how deep the rabbit-hole goes...*

# Overview
MatrixOS is a node application which provides a host for sensor libraries, computer vision software and Matrix applications. MatrixOS connects to the `matrix-streaming-server` to provide real-time, socket based information for clients.

# Private repos
Had to move `admatrix-node-sdk` and `admobilize-eventfilter-sdk` out of package.json for deployment reaosns.

Here is the mapping.
```
"admatrix-eventfilter-sdk": "git+ssh://git@bitbucket.org:admobilize/admobilize-eventfilter-sdk.git",
"admatrix-node-sdk": "git+ssh://git@bitbucket.org:admobilize/admobilize-node-sdk.git"
```


# Authentication
MatrixOS authentication is provided by `admatrix-node-sdk` using the device id and device secret.

# Local Storage
Device tokens and application state is saved on the local device via `nedb`.

# Globals
```
Matrix - is the primary global namespace.
  .api - access to node-sdk
  .db  - provides access to local storage
  .events - EventEmitter
  .activeProcesses - all active apps
  .service - all files in /lib/service
  .event - all files in /lib/event
  .device - all files in /lib/device
```
See below for more details

## Event Flow
Events are at the core of MatrixOS.

```
Events
app-config - sends an configuration to the infrastructure
app-emit - sends a datapoint to the infrastructure
app-log - sends a log to the infrastructure (only used with CLI now)
app-message - Global Interapp Messaging
app-{appName}-message - Targeted Interapp messaging
sensor-init - initialize a sensor
cli-message - incoming message from CLI
trigger - incoming event from dashboard / inter device messaging
token-refresh - get a new token
device-reboot - restart the device
```

## Application Lifecycle

### Start
Applications are managed by `/lib/service/manager.js`. Applications can be started by the CLI `matrix start` command or by providing a `START_APP` env variable with the name of the application. Each application is a discrete node process.

Starting an application does the following:

1. Checks config.json
1. Stops duplicates
1. Handles log and error messages for redirecting to CLI or Terminal
1. Routes messages sent from application to infrastructure
1. Sets up listeners for inter-app routing

### Installation
Applications are prompted to install on MatrixOS via infrastructure commands ( `cli-message` with `{type:'app-install'}` ). These commands include a URL which the Matrix downloads, conducts an `npm install` upon, and checks to make sure appropriate sensors are available (todo).

## App Messaging

### Global
Each app subscribes to the global app messaging channel `app-message`.

### Inter App
Each app sets up a targeted messaging channel `app-{appname}-message`.

### Inter Device / Trigger
Each app is available for inter device messages, which move on the `trigger` channel.  

## App Data Flows
External:

Applications send data with `matrix.send()` or `matrix.type('foo').send()`

Internal:

Data from an app process is captured and routed into the event system as `app-emit` events. These events are directed into `service.stream.sendDataPoint`, which sends the data point if there is a connection to the Streaming Server, or adds to a local storage queue if no connection is made.

## Socket Streaming Server Connection

### Register Device
The first step in establishing a socket connection is to send a `device-register` socket message.

### Progressive Check Delay
If no Streaming Server is visible, Matrix keeps trying with an ever-increasing delay.

### SocketEmit
`SocketEmit` is a custom wrapper around the socket to provide channel and message capabilities. Please use this when you want to send something to the server.

## Sensors
Sensors are provided by node modules with following namespace:

```
matrix.sensor.{sensorModel}.{systemArchitecture}
```

So for a MX1174 sensor to be installed on an ARM board, one would install `matrix.sensor.mx1174.arm` to the matrix os with the CLI command `matrix install -s mx1174`.

All sensor modules are written to a common specification, which allows them to interchange easily with matrix apps using sensor.type as the single point of reference.

# Installation
```
git clone git@bitbucket.org:admobilize/admatrix.git
cd admatrix
npm install
```
# Running

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
ADMATRIX_STREAMING_SERVER http://localhost:3000 - points to admatrix-streaming-server
ADMATRIX_CLIENT_ID AdMobilizeClientID - assigned id
ADMATRIX_CLIENT_SECRET AdMobilizeClientSecret - assigned secret
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
