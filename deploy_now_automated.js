const { spawn } = require('child_process');

const args = [
  '-o', 'StrictHostKeyChecking=no',
  '-tt', 'root@156.67.24.6',
  'cd /var/www/engiinshop && git fetch --all && git reset --hard origin/main && npm install && npx prisma db push && rm -rf .next && npm run build && pm2 restart engiinshop'
];

const pass = '+(q/pvUP]!R11j/'; // From deploy_ssh.js

console.log('Deploying to anarkoreashop.mn (156.67.24.6)...');

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
    console.log('\n✅ Deployment completed successfully!');
  } else {
    console.log(`\n❌ Deployment failed with code ${code}`);
  }
});
