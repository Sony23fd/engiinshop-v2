const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const pubKeyPath = path.join(process.env.USERPROFILE, '.ssh', 'id_rsa.pub');
const pubKey = fs.readFileSync(pubKeyPath, 'utf8').trim();

const args = [
  '-o', 'StrictHostKeyChecking=no',
  '-tt', 'root@156.67.24.6',
  `mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "${pubKey}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`
];

const pass = '+(q/pvUP]!R11j/';

console.log('Copying SSH public key to 156.67.24.6...');
const ssh = spawn('ssh', args);

ssh.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  if (output.toLowerCase().includes('password')) {
    ssh.stdin.write(pass + '\n');
  }
});

ssh.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(output);
  if (output.toLowerCase().includes('password')) {
    ssh.stdin.write(pass + '\n');
  }
});

ssh.on('close', (code) => {
  if (code === 0) {
    console.log('SSH public key successfully added!');
  } else {
    console.log(`Failed to add SSH public key. Exit code: ${code}`);
  }
});
