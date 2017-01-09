from pathlib import Path
print('Running' if __name__ == '__main__' else 'Importing', Path(__file__).resolve())
import importlib

class Application:

    def __init__(self, name):
        self.name = name
        self.typeMap = []

    def start(self):
        print('starting app')
        self.instance = importlib.import_module(self.name + '.app')

    def route(self, type, data):
        pass


    def add_type_map(type, fn):
        """ Adds map for type to function """
