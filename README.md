# AdMatrix Device Container Kit

NOTICE: Sensors requires node v0.10


Requires env vars to be set, otherwise defaults are used.
```
ADMATRIX_API_SERVER http://localhost:1337 -- points to admobilize-api server\
ADMATRIX_STREAMING_SERVER http://localhost:1338 - points to admatrix-streaming-server
ADMATRIX_CLIENT_ID AdMobilizeClientID - assigned id
ADMATRIX_CLIENT_SECRET AdMobilizeClientSecret - assigned secret
ADMATRIX_USER - diego@rokk3rlabs.com - user to login with
ADMATRIX_PASSWORD - trudat
```

```
Matrix
|_device  - Everything having to do with the device
| |_bluetooth          - ( init, createCharacteristic, createService )
| |_daemon             - Start / Kill Processes ( Not Intended for Apps )
| |_file               - File Reading / Writing Utilities
| |_manager            - ( reboot, setupDNS )
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
| |_lifecycle          - 
| |_logging            -
| |_manager            -
| |_media              -
| |_server             -
| |_stream             -
| |_sync               -
| |_token              -

Matrix
  .device
    .
  .events

  .service

events
[See](https://docs.google.com/spreadsheets/d/131aFIKZRKLm8fIlFbYi-AnroEXMSJvxtpyujY18zcHk/edit?usp=sharing)
Event Name Semantic rules
**Noun-Verb** or **Container-Object**
```
->
device-register
sensor-emit
filtered-sensor-emit
---

```


custom global functions
```
clog() - console.log shortcut, no logentries
ulog() - utility log, pretty prints object, no Logentries
log() - logentries
warn() - logentries
error() - logentries
```
