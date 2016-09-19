# MATRIX OS

# Overview
MATRIX Open Source is a platform for running applications on the MATRIX Creator. Many other hardware platforms will be supported.

###### Bugs
https://github.com/matrix-io/matrix-os/issues

###### Questions
http://community.matrix.one

###### Documentation
http://matrix-io.github.io/matrix-documentation

## MATRIX Applications
MATRIX applications are built in JavaScript to logically connect sensor and computer vision data streams with outputs, such as LED lights, sending voltages, integrations and data for dashboards and analysis.

An example application would recognize your face and unlock your front door. A security gesture could be added for a basic level of access control. A 2 factor QR Code provided over the phone or fingerprint reader could be integrated for the much more security.

Using [configuration files](https://matrix-io.github.io/matrix-documentation/Configuration/examples/), an application end-user could customize an application for their specific use case. Adding API keys or custom phrases.

### Layers
Matrix OS communicates with the hardware via an interpretive layer.

#### Why JavaScript?
Lots of people already know JavaScript, and there is a rich module ecosystem. Part of our goal is to put IoT into the hands of more people.

#### What about MY language?
Don't worry. We like other languages too, all it will need is a supporting SDK. Coming soon.

#### Applications?
 MATRIX Applications can be used in the traditional manner of an app, single user, single device. We believe swarming meshes of interconnected data streams will be a more common pattern. Most devices will use many applications at once, and many will operate entirely without direct manipulation by an end user. We have built [inter-app messaging protocols](https://matrix-io.github.io/matrix-documentation/API/cross-talk) to help this.

#### Open Source
We built MATRIX on top of open source software and we are releasing it for everyone to see under the hood and make contributions😎. We believe in open access to information, especially for the IoT space, where security and privacy are of the utmost importance.

## Great, how do I use the thing over the internet?
You will want to start by using the CLI to easily manage MATRIX OS on your MATRIX Creator. See https://github.com/matrix-io/matrix-cli

```
npm install -g matrix-cli
```

# Developer Information
The below is intended for developers working on this repository.

# First

Clone repo and update protobufs
```
git clone https://github.com/matrix-io/matrix-os.git
git submodule update --init
```

### Debugging

Use `DEBUG=* node index.js` to see all debug messages.

#### Debug categories

` app, sensor, stream, matrix `

**example:**
To see output from socket streams and apps, do
`DEBUG=app,stream`

To exclude engine-io from the output, do
`DEBUG=*,-engine*`

## Environment Variables
```
MATRIX_API_SERVER http://dev-demo.admobilize.com -- points to admobilize-api server
MATRIX_STREAMING_SERVER http://dev-mxss.admobilize.com:80 - points to admatrix-streaming-server
```
## Start your MATRIX OS with a monitor App

```
START_APP=monitor node index.js
```

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
Events are at the core of MATRIX OS. This is how information is sent between the applications and the sockets.

```
Events
app-config - sends an configuration to the infrastructure
app-emit - sends a datapoint to the infrastructure
app-log - sends a log to the infrastructure (only used with CLI now)
app-message - Global Interapp Messaging
app-{appName}-message - Targeted Interapp messaging
sensor-init - initialize a sensor
cli-message - incoming message from CLI
trigger - incoming event from dashboard / cross messaging
token-refresh - get a new token
device-reboot - restart the device
```

Every file in `Matrix.event` that has an init() will run that automatically. This is to populate the event listeners.

## Application Lifecycle

### Configuration
On `matrix deploy`, configuration is overwritten with `config.yaml`. Otherwise, Firebase is the source of configuration truth with a fall back to `config.yaml` for defaults.

When an application runs, however, a `config.json` is written with the active config, and used for the application.

### Start
Applications are managed by `/lib/service/manager.js`. Applications can be started by the CLI `matrix start` command or by providing a `START_APP` env variable with the name of the application. Each application is a discrete node process.

Starting an application does the following:

1. Checks config.json
1. Stops duplicates
1. Handles log and error messages for redirecting to CLI or Terminal
1. Routes messages sent from application to infrastructure
1. Sets up listeners for inter-app routing

### Installation
Applications are prompted to install on MATRIX OS via infrastructure commands ( `cli-message` with `{type:'app-install'}` ). These commands include a URL which the Matrix downloads, conducts an `npm install` upon, and checks to make sure appropriate sensors are available (todo).

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

### Initial Connection
The Streaming Server is contacted with a `deviceToken` parameter. Success = `auth-ok` message

### Register Device
The first step in establishing a socket connection is to send a `device-register` socket message.

### Progressive Check Delay
If no Streaming Server is visible, Matrix keeps trying with an ever-increasing delay.

### SocketEmit
`SocketEmit` is a custom wrapper around the socket to provide channel and message capabilities. Please use this when you want to send something to the server.

## Docker development workflow

The repo includes a `docker-compose.yml` file. This file contains information to run a containerized version of the MATRIX OS. Please make sure you are running either Linux or the native Docker app, and issue:

```
docker-compose run --service-ports mos [optional command]
```

The above command will:

  - Build the image that contains all required dependencies to run the MATRIX OS.
  - Mount the current directory inside `/matrix` dir inside the container, meaning
    that changes performed on your local file system will show up inside the
    container as well.
  - Run `nodemon index.js` inside the container, exposing port 80 on your local machine. It
    will also reinstall all your node_modules if `REINSTALL_NODE_MODULES: 1`. This is
    useful in development as helps dealing with `node_modules` in different branches, and
    avoids ugly bugs with hard-coded `node_modules` built in OSX that won't work on Linux.

This flow can play nice with say, MXSS also running in the same machine. More about that soon.

## On Device Debugging Workflow

Put this in your `.zshrc`
```
alias mm='NODE_ENV=dev node index.js'
alias mdm='NODE_ENV=dev node --debug-brk index.js'

alias ms=__ms
function __ms(){
START_APP=$1 mm
}
alias mds=__mds
function __mds(){
START_APP=$1 mdm
}
```

Highly recommend [node-vim-debugger](https://github.com/sidorares/node-vim-debugger). Three ssh sessions required.

```
mds monitor
node-vim-inspector
vim -nb or :nbs from inside vim
```

```
:e filepath
^-p to set a breakpoint
^-c to continue
^-n next
^-i step in
^-o step out
^-u up stack
^-d down stack
```

## File Organization
- `lib` - holds most of the code
- `lib/device` - is for isolated device interaction utilities
- `lib/device/drivers` - is for device components
- `event` - events are setup and handled here
- `service` - constructors, utilities, protocols, etc

## New Drivers from MALOS

1. Duplicate a file from `lib/device/drivers` > `sensorname.js`
2. Update proto in `proto/malos/driver.proto`
3. Change read method in `sensorname.js` to point to proto message and field name
4. Change logs and component in `sensorname.js` to point at new sensorname
5. Update port number in `lib/device/port.js`
6. Update sensorTypeList in `lib/device/sensor.js`

## Maintainers

Sean Canton <sean.canton@admobilize.com>
