#!/bin/sh
#
# Update travelrecorder python/shell stuff

echo 'Updating travelrecorder'
echo

if [ -e /etc/init.d/travelrecorder ]; then
	echo 'Deamon was running, stopping it...'
	/etc/init.d/travelrecorder stop
else
	killall python
fi

cd /root/

# get new stuff
wget http://192.168.178.76:3000/travel-recorder/travel-recorder.tar.gz
gunzip travel-recorder.tar.gz
tar -xf travel-recorder.tar

# clean old stuff
rm *.pyc *.tar

# set/clean init scripts
mv rc-local /etc/rc.local
mv init /etc/init.d/travelrecorder

echo ''
/etc/init.d/travelrecorder enable
echo 'travelrecorder enabled, starting...'
/etc/init.d/travelrecorder start
