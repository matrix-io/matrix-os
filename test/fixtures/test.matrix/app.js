// typed send
matrix.type('testType').send({ foo: 1 })

// default typed send
matrix.send({foo:2})

//send global message
matrix.emit('foo')

//send app specific message
matrix.emit('otherapp', 'foo')

//send namespaced message
matrix.emit('otherapp','nameofevent', 'foo')
