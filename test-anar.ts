import * as fs from 'fs';
const data = JSON.parse(fs.readFileSync('anar.txt', 'utf8'));
const orders = data.data.orders;
orders.forEach((b: any) => {
  b.orderitemSet.forEach((item: any) => {
    if (item.name && item.name.toLowerCase().includes('zulaa')) {
      console.log('FOUND ZULAA:', item.name, 'PHONE:', item.phoneNumber);
    }
    if (item.name && item.name.toLowerCase().includes('bariushaa')) {
      console.log('FOUND BARIUSHAA:', item.name, 'PHONE:', item.phoneNumber);
    }
  });
});
