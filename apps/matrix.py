import json, sys, io
from time import sleep
import asyncio
#
# def init(n=None):
#   if n == None:
#       return
#   print( json.dumps({'type':'sensor-init', 'name': n }))
#
# # for line in sys.stdin.readlines():
# #   init(line)
#
# def print_json(future):
  # return await future.result()
#
# async def read_stdin():
  # return await input();
#
async def check_stdin():
    while True:
      print(input())

    asyncio.sleep(1)
    print(json.dumps({ 'check': 'true' }))
    return await read_stdin()
#
loop = asyncio.get_event_loop()
#
task = loop.create_task(check_stdin())
# task.add_callback(print_json)
# loop.run_until_complete(check_stdin())
# loop.close()
loop.run_forever()
#
#
# loop.close()

###
#
# import asyncio
#
#
# async def slow_operation():
#     await asyncio.sleep(1)
#     return 'Future is done!'
#
#
# def got_result(future):
#     print(future.result())
#
#     # We have result, so let's stop
#     loop.stop()
#
#
# loop = asyncio.get_event_loop()
# task = loop.create_task(slow_operation())
# task.add_done_callback(got_result)
#
# # We run forever
# loop.run_forever()
