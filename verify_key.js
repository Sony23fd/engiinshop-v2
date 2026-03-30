const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const pubKeyPath = path.join(process.env.USERPROFILE, '.ssh', 'id_rsa.pub');
const pubKey = fs.readFileSync(pubKeyPath, 'utf8').trim();

console.log('Verifying SSH entry on 156.67.24.6...');

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`cat ~/.ssh/authorized_keys`, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code, signal) => {
      console.log('Contents retrieved.');
      if (output.includes(pubKey.substring(0, 50))) {
        console.log('Key is present!');
      } else {
        console.log('Key NOT found!');
      }
      conn.end();
    }).on('data', (data) => {
      output += data.toString();
    });
  });
}).connect({
  host: '156.67.24.6',
  port: 22,
  username: 'root',
  password: '+(q/pvUP]!R11j/'
});
