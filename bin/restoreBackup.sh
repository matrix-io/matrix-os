#!/bin/sh
VERSION=$1

TARGET=$HOME/matrix/
BACKUP=/tmp/matrix_backup/$VERSION/

rm -r $TARGET*
cp -r $BACKUP $TARGET

# start the thing again
./bin/start.sh
