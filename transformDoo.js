const fs = require('fs');

const rawData = fs.readFileSync('doo.json', 'utf8');
const orders = JSON.parse(rawData);

// Group by order_name (Batch name)
const groups = {};

orders.forEach(o => {
  const batchName = o.order_name || "Unknown Batch";
  if (!groups[batchName]) {
    groups[batchName] = [];
  }
  groups[batchName].push(o);
});

const legacyCategory = {
  name: "Legacy Import (Doo)",
  batches: []
};

Object.keys(groups).forEach(batchName => {
  const batchOrders = groups[batchName];
  legacyCategory.batches.push({
    productName: batchName,
    targetQuantity: batchOrders.length,
    remainingQuantity: 0,
    price: 0,
    cargoFeeStatus: "Бэлэн",
    description: "Imported from legacy",
    orders: batchOrders.map(bo => ({
      customerName: bo.name || "Unknown",
      customerPhone: bo.phone_number || "Unknown",
      accountNumber: "", // Not explicitly in doo.json
      quantity: bo.quantity || 1,
      deliveryAddress: bo.address || null,
      oldStatus: bo.status,
      // Total amount is not clear, but we can default to 0 for historical data
      totalAmount: 0 
    }))
  });
});

const finalData = {
  categories: [legacyCategory]
};

fs.writeFileSync('doo_transformed.json', JSON.stringify(finalData, null, 2));
console.log("Transformed " + orders.length + " orders into doo_transformed.json");
