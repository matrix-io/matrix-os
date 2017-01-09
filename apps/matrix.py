import json
import sys
import io
from time import sleep
import importlib

import pylib

def handle_input(str):
    """Route commands / data from MOS to apps"""
    global AppInstance

    event = json.loads(str)
    print(event)
    if event.get('event') == 'app-start':
        AppInstance = pylib.Application(event['value'])
        AppInstance.start()
    elif event.get('event') == 'app-data':
        print('data')
        AppInstance.route(event['type'], event['data'])


while True:
  stdin = input()
  if stdin is not None:
    handle_input( stdin )
