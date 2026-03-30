const { spawn } = require('child_process');

const args = [
  '-o', 'StrictHostKeyChecking=no',
  '-tt', 'root@156.67.24.6',
  'node -v; psql --version; pm2 -v; nginx -v; certbot --version'
];

const pass = '+(q/pvUP]!R11j/';

console.log('Connecting to 156.67.24.6...');
const ssh = spawn('ssh', args);

ssh.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write('OUT: ' + output);
  if (output.toLowerCase().includes('password')) {
    ssh.stdin.write(pass + '\n');
  }
});

ssh.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write('ERR: ' + output);
  if (output.toLowerCase().includes('password')) {
    ssh.stdin.write(pass + '\n');
  }
});

ssh.on('close', (code) => {
  console.log(`SSH process exited with code ${code}`);
});
