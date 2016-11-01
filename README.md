# MATRIX OS

![matrix os launches](http://i.makeagif.com/media/5-10-2016/TDceSN.gif)

# Overview
MATRIX Open Source is a platform for running applications on the MATRIX Creator.

###### Bugs
https://github.com/matrix-io/matrix-os/issues

###### Questions
http://community.matrix.one

###### Documentation
http://matrix-io.github.io/matrix-documentation

## Alpha Installation Instructions
New parts of the MATRIX ecosystem are being developed and integrated every day. Here are a set of instructions which will get MATRIX OS running on your Creator. This will be streamlined in the future.

## Configuring Environments
While in alpha, MATRIX OS will default to `rc`.

* Change environment by setting `NODE_ENV`. ex. `NODE_ENV=rc node index.js`. 
* From the CLI use `matrix set env rc`.

**Note:** Make sure your device software and CLI are using the same environment.

#### Cutting Edge

`dev` - development environment

You will have to make a second account for this environment (use `matrix register`). Test out the newest features before they move to `rc`. You will have to recreate your devices here.

## MATRIX Applications
MATRIX applications are built in JavaScript to logically connect sensor and computer vision data streams with outputs, such as LED lights, sending voltages, integrations and data for dashboards and analysis.

An example application would recognize your face and unlock your front door. A security gesture could be added for a basic level of access control. A 2 factor QR Code provided over the phone or fingerprint reader could be integrated for the much more security.

Using [configuration files](https://matrix-io.github.io/matrix-documentation/Configuration/examples/), an application end-user could customize an application for their specific use case. Adding API keys or custom phrases.

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

Use `DEBUG=* node index.js` to see all debug messages. The debug options are: `app, sensor, stream, matrix, *, -engine*`. Note: `-engine*` excludes engine.io logs.

### Disable upgrades
```
NO_UPGRADE=true node index.js
```

### On Device Debugging Workflow

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
Diego Ribero <diego.ribero@admobilize.com>

