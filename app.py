#!/usr/bin/env python
#

import serial
import pynmea2

def main():
    port = serial.Serial()
    port.baudrate = 4800
    port.port = '/dev/ttyUSB0'
    port.xonxoff = 1

    port.open()

    # discard 4 raw lines:
    port.readline()

    print 'trying streamreader: '
    streamreader = pynmea2.NMEAStreamReader(port)

    while True:
        for msg in streamreader.next():
            print msg
            print msg.latitude, msg.longitude


if __name__ == '__main__':
        main()
