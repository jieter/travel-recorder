#!/usr/bin/env python
#

from datetime import datetime
import os
import pynmea2
from pynmea2.types import GGA, RMC
import serial

DATA_PATH = 'data/'
log = None

def open_gps():
    port = serial.Serial()
    port.baudrate = 4800
    port.port = '/dev/ttyUSB0'
    port.xonxoff = 1

    port.open()

    # discard 2 raw lines:
    port.readline()
    port.readline()

    return port


class LogFile(object):

    def __init__(self, path):
        if not os.path.exists(path):
            os.mkdir(path)

    def add(self, row):
        self.file.write(row.toCSV())


class MsgWrapper(object):
    def __init__(self, msg):
        self.msg = msg

    def __getattr__(self, name):
        try:
            return getattr(self.msg, name)
        except:
            raise AttributeError(name)

    def datetime(self):
        return datetime.combine(self.msg.datestamp, self.msg.timestamp)

    def log(self):
        if log is not None:
            log.add(self)

    def toCSV(self):
        return ';'.join([
            self.datetime(),
            self.latitude, self.longitude,
            self.spd_over_grnd, self.true_course
        ])


def main():
    print 'Starting...'


    log = LogFile(DATA_PATH)

    gps = open_gps()

    print 'trying streamreader: '
    streamreader = pynmea2.NMEAStreamReader(gps)

    while True:
        for msg in streamreader.next():
            # print '  ', msg
            if isinstance(msg, RMC):
                msg = MsgWrapper(msg)

                msg.log()

                timestamp = datetime.combine(msg.datestamp, msg.timestamp)
                print '%s,%f, %f SOG: %fkts COG: %sM' % (
                    timestamp,
                    msg.latitude, msg.longitude,
                    msg.spd_over_grnd,
                    msg.true_course
                )
            # if isinstance(msg, RMC):
            #     print msg.fields



if __name__ == '__main__':
        main()
