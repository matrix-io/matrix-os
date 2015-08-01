#!/bin/sh
VERSION=$1
OLD_VERSION=$2

UPDATE=/tmp/matrix_update/$VERSION
TARGET=$HOME/matrix/
BACKUP=/tmp/matrix_backup/$OLD_VERSION

mkdir -p $UPDATE $BACKUP

# backup old version
cp -vr $TARGET $BACKUP
rm -r $TARGET*

# extract update
unzip $UPDATE/update.zip -d $TARGET

# start the thing again
./bin/start.sh
