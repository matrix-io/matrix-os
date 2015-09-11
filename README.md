# AdMatrix Device Container Kit


Requires env vars to be set, otherwise defaults are used.
```
ADMATRIX_API_SERVER http://dev-demo.admobilize.com -- points to admobilize-api server
ADMATRIX_STREAMING_SERVER http://localhost:3000 - points to admatrix-streaming-server, deploy with convox
ADMATRIX_CLIENT_ID AdMobilizeClientID - assigned id
ADMATRIX_CLIENT_SECRET AdMobilizeClientSecret - assigned secret
ADMATRIX_USER - brian@rokk3rlabs.com - user to login with
ADMATRIX_PASSWORD - Trudat55
```

## install
```

# from local admatrix parent folder
zip -r admatrix.zip admatrix/ -x *.git*
scp admatrix.zip admatrix@192.168.1.129:~/

# on device
unzip admatrix.zip -d admatrix

npm install -g node-gyp nodemon

# rebuilds node-gyp
npm rebuild

ADMATRIX_SENSOR_REFRESH=500 START_APP=test nodemon
```

Prevent sudo for aplay

`apt-get install jackd2`

#adsensors setup

Clone admobilize-adsensor repo
Copy admobilize-adsensor/node-adsensors/ contents into admatrix/node_modules/adsensors
`npm install` in admatrix/

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

# Events
(See)[https://docs.google.com/spreadsheets/d/131aFIKZRKLm8fIlFbYi-AnroEXMSJvxtpyujY18zcHk/edit?usp=sharing]


# Developer Help

Custom global functions

```
clog() - console.log shortcut, no logentries
ulog() - utility log, pretty prints object, no Logentries
log() - logentries
warn() - logentries
error() - logentries
```