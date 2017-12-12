/**
 * For load testing. Move a pointer through a file serving up deviceIds / secrets for subsequent calls to /next
 */

const fs = require('fs');
const http = require('http')

var secrets = fs.readFileSync('creds');
// cast into array
secrets = secrets.toString().split('\n');

secrets = secrets.map((s) => { if (s.length > 2) return s });

console.log(secrets.length, 'secrets read');


const server = http.createServer((req, res) => {
  let send = secrets.shift();
  console.log('Sending>>', send);
  res.write(send);
  res.end();
})

server.listen(8000, () => {
  console.log('Server listening on 8000');
})
