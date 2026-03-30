const { Client } = require('ssh2');
const conn = new Client();

console.log('Cloning the repository to 156.67.24.6...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  // Clone the code. We redirect stderr to stdout to see any git errors.
  const cloneCmd = `
    cd /var/www
    rm -rf engiinshop
    git clone https://github.com/Sony23fd/engiinshop-v2 engiinshop
  `;
  
  conn.exec(cloneCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Clone process ended. Exit code: ' + code);
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
