#!/bin/bash

sudo systemctl stop matrixio-os.service 
sudo systemctl disable matrixio-os.service
sudo rm /lib/systemd/system/matrixio-os.service
sudo rm -rf /var/matrix-os/ /usr/lib/matrix-os/
sudo userdel -r matrixio-os
