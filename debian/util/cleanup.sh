#!/bin/bash

sudo systemctl stop matrix-os.service 
sudo systemctl disable matrix-os.service
sudo rm /lib/systemd/system/matrix-os.service
sudo rm -rf /var/matrix-os/ /usr/lib/matrix-os/
sudo userdel -r matrix-os
