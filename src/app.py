#!/usr/bin/env python
#

from datetime import datetime, timedelta
import os
import pynmea2
from pynmea2.types import GGA, RMC
import time
import sys
from commands import getoutput

from util import taskRunner, open_gps

class LogFile(object):
    filename = None
    last = None
    LOG_FORMAT = '%Y-%m-%d-log.csv'

    def __init__(self, path = '/tmp', interval=20):
        if not os.path.exists(path):
            os.mkdir(path)

        self.path = path

        self.interval = timedelta(seconds=interval)

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

        # update index
        indexFile = os.path.join(self.path, 'index.txt')
        with open(indexFile, 'w') as index:
            for f in os.listdir(self.path):
                if f.endswith('.csv'):
                    index.write(str(f) + '\n')



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
        return self.msg.spd_over_grnd

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


DATA_PATH = 'site/data/'
log = LogFile(DATA_PATH)

def log_1hz(msg):
    with open(os.path.join(DATA_PATH, 'current.txt'), 'w') as l:
        if msg.speed():
            l.write('{"speed": %0.00f, "location": [%f, %f], "timestamp": "%s"}' % (
                msg.speed(),
                msg.latitude,
                msg.longitude,
                msg.datetime()
            ))
        else:
            l.write('{"message": "No Fix"}')


def mount_usb():
    '''mount usb stick if not mounted'''

    try:
        res = getoutput('ifconfig | grep 90:2b:34:d0:99:88')
        if len(res) > 0:
            print 'This is not carambola'
            return

        res = getoutput('mount | grep /root/site')
        if not res.startswith('/dev/sda1'):
            os.system('rm /root/site')
            os.system('mount /dev/sda1 /root/site')
            print 'mounted usb stick'
        else:
            print 'not mounting'

    except Exception, e:
        print str(e)


def main():
    print 'Starting travel-recorder...'

    mount_usb()
    print getoutput('/bin/sh /root/fix-wifi.sh')
    taskRunner(100, mount_usb)

    gps = open_gps()
    streamreader = pynmea2.NMEAStreamReader(gps)

    while True:
        for msg in streamreader.next():
            if isinstance(msg, RMC):
                msg = MsgWrapper(msg)

                msg.log()

                log_1hz(msg)


if __name__ == '__main__':
    while True:
        try:
            main()
        except KeyboardInterrupt:
            log.close()
            sys.exit()
        # except Exception, e:
        #     print 'Error: ', str(e)
        #     print 'Sleeping for 60 seconds and try to restart main thread...'
        #     time.sleep(60)
