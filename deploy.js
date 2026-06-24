const { Client } = require('ssh2');

const conn = new Client();

const commands = [
  'cd /var/www/engiinshop',
  'git config pull.rebase false',
  'git pull origin main',
  'if ! grep -q "SESSION_SECRET" .env; then echo \'SESSION_SECRET="engiinshop-admin-session-secret-32-chars!"\' >> .env; fi',
  'npm install',
  'npx prisma generate',
  'npm run build',
  'pm2 restart all'
];

const script = commands.join(' && ');

conn.on('ready', () => {
  console.log('SSH Connection established.');
  console.log('Running deployment commands...');
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code, signal) => {
      console.log('Deployment stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      process.stderr.write('STDERR: ' + data);
    });
  });
}).connect({
  host: '156.67.24.6',
  port: 22,
  username: 'root',
  password: '+(q/pvUP]!R11j/'
});
