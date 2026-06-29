const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('grep -v "Failed to find Server Action" /root/.pm2/logs/engiinshop-error.log | grep -v "ignore-listed" | tail -n 50', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', data => process.stdout.write(data))
      .stderr.on('data', data => process.stderr.write(data));
  });
}).connect({ host: '156.67.24.6', port: 22, username: 'root', password: '+(q/pvUP]!R11j/' });
