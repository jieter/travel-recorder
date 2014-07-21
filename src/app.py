#!/usr/bin/env python
#

from datetime import datetime, timedelta
import os
import pynmea2
from pynmea2.types import GGA, RMC
import serial

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
    filename = None
    last = None
    LOG_FORMAT = '%Y-%m-%d-log.csv'

    def __init__(self, path = '/tmp', interval=30):
        if not os.path.exists(path):
            os.mkdir(path)

        self.path = path

        self.interval = timedelta(seconds=interval)

        print self.path, self.interval

    def write(self, record):
        try:
            self.file.write(record.toCSV() + '\n')
        except AttributeError:
            pass

    def exists(self, name):
        return os.path.exists(os.path.join(self.path, name))

    def set_date(self, date):
        filename = os.path.join(self.path, date.strftime(self.LOG_FORMAT))

        if self.filename is filename:
            return
        self.filename = filename
        self.file = open(filename, 'a')


    def add(self, record):
        if self.last is None or record.datetime() - self.last >= self.interval:
            self.last = record.datetime()

            self.set_date(record.datetime())

            self.write(record)
            print record.datetime(), 'wrote'

    def close(self):
        self.file.close()



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

    def speed(self):
        return self.msg.spd_over_grnd()

    def log(self):
        log.add(self)

    def toCSV(self):
        return ';'.join(map(str, [
            self.timestamp,
            self.latitude, self.longitude,
            self.speed(), self.true_course
        ]))

    def __str__(self):
        return self.msg.__str__()


DATA_PATH = 'data/'
log = LogFile(DATA_PATH)

def log_speed(speed):
    with open(os.path.join(DATA_PATH, 'speed.txt'), 'w') as l:
        l.write('%0.00f' % speed)

def main():
    print 'Starting...'

    gps = open_gps()

    print 'trying streamreader: '
    streamreader = pynmea2.NMEAStreamReader(gps)

    while True:
        for msg in streamreader.next():
            if isinstance(msg, RMC):
                msg = MsgWrapper(msg)

                msg.log()

                log_speed(msg.speed())


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log.close()
