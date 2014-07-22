#__init__.py

import threading
import os
import serial

def taskRunner(n, func):
    assert type(n) == int
    def and_again():
        func()
        t = threading.Timer(n, and_again)
        t.daemon = True
        t.start()
        return t

    return and_again()

def uptime():
    ret = 0
    with open('/proc/uptime', 'r') as f:
        ret = float(f.readline().split()[0])

    return ret

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
