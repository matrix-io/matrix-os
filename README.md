# AdMatrix Device Container Kit

NOTICE: Sensors requires node v0.10


Requires env vars to be set, otherwise defaults are used.
```
ADMATRIX_API_SERVER http://localhost:1337 -- points to admobilize-api server\
ADMATRIX_STREAMING_SERVER http://localhost:1338 - points to admatrix-streaming-server
ADMATRIX_CLIENT_ID aefdfaexx - assigned id
ADMATRIX_CLIENT_SECRET aefsfexx - assigned secret
ADMATRIX_USER - test@test.com - user to login with
ADMATRIX_PASSWORD - password
```

events
```
->
device-register
data-point
filtered-data-point
```


custom global functions
```
clog() - console.log shortcut, no logentries
ulog() - utility log, pretty prints object, no Logentries
log() - logentries
warn() - logentries
error() - logentries
```
