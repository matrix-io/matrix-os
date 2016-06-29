// typed send
matrix.type('testType').send({ foo: 1 })

// default typed send
matrix.send({foo:2})

//send global message
matrix.emit('foo')

//send app specific message
matrix.emit('otherapp', 'otherfoo')

//send namespaced message
matrix.emit('otherapp','nameofevent', 'namedfoo')


console.log('Finished!')
process.exit();
