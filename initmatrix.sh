#!/bin/sh
### BEGIN INIT INFO
# Provides:          MATRIX OS
# Required-Start:    $all
# Required-Stop:     
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Manage MATRIX OS Start / Stop
### END INIT INFO

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/bin

. /lib/init/vars.sh
. /lib/lsb/init-functions
# If you need to source some other scripts, do it here

case "$1" in
  start)
    log_begin_msg "Starting MATRIX OS"
    node /home/pi/matrix-os/index.js
    log_end_msg $?
    exit 0
    ;;
  stop)
    log_begin_msg "Stopping MATRIX OS"

    # do something to kill the service or cleanup or nothing
    sudo pkill -15 node
    log_end_msg $?
    exit 0
    ;;
  *)
    echo "Usage: /etc/init.d/<your script> {start|stop}"
    exit 1
    ;;
esac


## Install
# cp initmatrix.sh -> pi
# chmod -x initmatrix.sh
# mv initmatrix /etc/init.d/matrix
# sudo update-rc.d matrix defaults
#
# logs - sudo systemctl status matrix -ln 20
