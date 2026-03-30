const { Client } = require('ssh2');
const conn = new Client();

console.log('Connecting to 156.67.24.6 to WIPE old data...');

conn.on('ready', () => {
  console.log('Client :: ready');
  // 1. Wipe /var/www/
  // 2. Stop/Delete PM2 processes
  const cmd = `rm -rf /var/www/* && pm2 delete all || true && mkdir -p /var/www/engiinshop`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Server WIPED! Exit code: ' + code);
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
