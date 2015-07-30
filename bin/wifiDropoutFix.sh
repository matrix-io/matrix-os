#!/bin/sh
FILEPATH=/etc/modprobe.d
FILE=8192cu.conf
CONFIG_VALUES="options 8192cu rtw_power_mgnt=0 rtw_enusbss=1 rtw_ips_mode=1"

addConfiguration() {

	#Create temp file
	if sudo printf "# Disable power saving\n$CONFIG_VALUES" > "/tmp/${FILE}" ; then

		#Copy file to proper location
		echo "Adding configuration parameters..."
		if sudo cp -pR /tmp/${FILE} ${FILEPATH}/; then
			echo "Successfully updated configuration file (OK)"
			exit 0
		else
			echo "Failed to add configuration parameters (X)"
			exit 3
		fi

	else
		echo "Failed to create configuration parameters file (X)"
		exit 2
	fi
}


#### Remember the user that this script must be run as super user
if ! [ $USER = root ]; then
  echo "Remember to run this script as root (X)\n"
  exit 1
fi

# Check if file exists
# /etc/modprobe.d/8192cu.conf
if [ -f "${FILEPATH}/${FILE}" ]; then
	echo "Configuration file found (OK)"

	# Verify if proper configuration is found
	if grep -q '${CONFIG_VALUES}' ${FILEPATH}/${FILE} ; then
		echo "Wifi dropout fix found (OK)"
		exit 4
	else
		#Create file
		echo "Creating configuration file..."
		addConfiguration
	fi
fi

#Create file
echo "Creating configuration file..."
addConfiguration
