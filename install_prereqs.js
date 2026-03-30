const { Client } = require('ssh2');
const conn = new Client();

console.log('Checking/Installing Prerequisites on 156.67.24.6...');

conn.on('ready', () => {
  console.log('Client :: ready');
  const installCmd = `
    # Install Node.js if missing
    if ! command -v node &> /dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
    fi
    # Install PostgreSQL if missing
    if ! command -v psql &> /dev/null; then
      apt-get update
      apt-get install -y postgresql postgresql-contrib
      systemctl start postgresql
      systemctl enable postgresql
      # Set postgres password
      sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'EngiinShop2026';"
    fi
    # Install PM2 if missing
    if ! command -v pm2 &> /dev/null; then
      npm install -g pm2
    fi
    # Install Nginx and Certbot
    apt-get install -y nginx certbot python3-certbot-nginx
  `;
  conn.exec(installCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Prerequisites CHECKED/INSTALLED! Exit code: ' + code);
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
