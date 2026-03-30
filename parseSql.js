const fs = require('fs');
const readline = require('readline');

// PostgreSQL-ээс гаргаж авсан TSV мэдээллийн текстийг уншиж хуваах программ
async function parseSql() {
  console.log('Баазыг уншиж эхэллээ...');
  
  if (!fs.existsSync('oldie.sql')) {
     console.error("oldie.sql файл олдсонгүй! Төслийн хавтас руу хуулж тавьсан эсэхээ шалгана уу.");
     return;
  }

  const fileStream = fs.createReadStream('oldie.sql');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentTable = null;
  
  // Дата цуглуулах савнууд
  const tables = {
    orderStatus: [],
    orderParent: [],
    order: [],
    orderItem: []
  };

  for await (const line of rl) {
    if (line.startsWith('COPY public.order_orderstatus ')) {
      currentTable = 'orderStatus';
      continue;
    } else if (line.startsWith('COPY public.order_orderparent ')) {
      currentTable = 'orderParent';
      continue;
    } else if (line.startsWith('COPY public.order_order ')) {
      currentTable = 'order';
      continue;
    } else if (line.startsWith('COPY public.order_orderitem ')) {
      currentTable = 'orderItem';
      continue;
    } else if (line.startsWith('\\.')) {
      currentTable = null;
      continue;
    }

    if (currentTable) {
      if (line.trim() === '') continue;
      // Tab-аар тусгаарлагдсан байгаа тул мөрсийг таслах
      const cols = line.split('\t');
      
      if (currentTable === 'orderStatus') {
        tables.orderStatus.push({
          id: cols[0],
          name: cols[1],
          createdAt: cols[2],
          isLast: cols[3] === 't'
        });
      } else if (currentTable === 'orderParent') {
        tables.orderParent.push({
          id: cols[0],
          name: cols[1],
          createdAt: cols[2],
          updatedAt: cols[3]
        });
      } else if (currentTable === 'order') {
        tables.order.push({
          id: cols[0],
          name: cols[1],
          description: cols[2] === '\\N' ? null : cols[2],
          orderDate: cols[3],
          createdAt: cols[4],
          createdUserId: cols[5],
          parentId: cols[6] === '\\N' ? null : cols[6],
          goal: parseInt(cols[7]) || 0,
          shippingPrice: parseInt(cols[8]) || 0,
          weight: cols[9]
        });
      } else if (currentTable === 'orderItem') {
        tables.orderItem.push({
          id: cols[0],
          name: cols[1],
          description: cols[2] === '\\N' ? null : cols[2],
          phoneNumber: cols[3],
          quantity: parseInt(cols[4]) || 1,
          shippingPrice: parseInt(cols[5]) || 0,
          address: cols[6] === '\\N' ? null : cols[6],
          arriveDate: cols[7] === '\\N' ? null : cols[7],
          deliverDate: cols[8] === '\\N' ? null : cols[8],
          createdAt: cols[9],
          updatedAt: cols[10],
          orderId: cols[11],
          statusId: cols[12]
        });
      }
    }
  }

  console.log(`Төлөв: ${tables.orderStatus.length}, Ангилал: ${tables.orderParent.length}, Захиалга: ${tables.order.length}, Дэд захиалга: ${tables.orderItem.length} ш тус тус олдлоо. Шилжүүлж байна...`);

  // JSON бүтэц рүү угсрах
  const orderParents = tables.orderParent.map(p => {
    return {
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      orderSet: tables.order.filter(o => o.parentId === p.id).map(o => {
        return {
          id: o.id,
          name: o.name,
          description: o.description,
          orderDate: o.orderDate,
          goal: o.goal,
          shippingPrice: o.shippingPrice,
          weight: o.weight,
          orderitemSet: tables.orderItem.filter(i => i.orderId === o.id).map(i => {
            const status = tables.orderStatus.find(s => s.id === i.statusId);
            return {
              id: i.id,
              name: i.name,
              description: i.description,
              phoneNumber: i.phoneNumber,
              quantity: i.quantity,
              shippingPrice: i.shippingPrice,
              status: status ? {
                id: status.id,
                name: status.name,
                isLast: status.isLast,
                createdAt: status.createdAt
              } : null,
              address: i.address,
              arriveDate: i.arriveDate,
              deliverDate: i.deliverDate,
              createdAt: i.createdAt,
              updatedAt: i.updatedAt
            };
          })
        };
      })
    };
  });

  const finalOutput = { data: { orderParents } };
  fs.writeFileSync('new_engdata.json', JSON.stringify(finalOutput, null, 2));
  console.log('Амжилттай! "new_engdata.json" нэртэй шинэ бааз бэлэн боллоо!');
}

parseSql().catch(console.error);
