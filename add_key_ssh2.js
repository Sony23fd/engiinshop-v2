const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const pubKeyPath = path.join(process.env.USERPROFILE, '.ssh', 'id_rsa.pub');
const pubKey = fs.readFileSync(pubKeyPath, 'utf8').trim();

console.log('Connecting to 156.67.24.6 using ssh2...');

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "${pubKey}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('SSH public key added! Exit code: ' + code);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '156.67.24.6',
  port: 22,
  username: 'root',
  password: '+(q/pvUP]!R11j/'
});
