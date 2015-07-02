# Travel-recorder

Save GPS data to a USB stick.

# links
 - https://github.com/8devices/carambola2
 - http://pyserial.sourceforge.net/shortintro.html
 - https://github.com/Knio/pynmea2
 - http://aprs.gids.nl/nmea/


# Quick `gpsd` test:
```
opkg install gpsd kmod-usb-serial-pl2303 kmod-usb-serial

insmod usbserial pl2303
gpsd /dev/ttyUSB0
cgps
```
