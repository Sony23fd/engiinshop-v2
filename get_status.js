const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.orderStatusType.findMany().then(s => { console.log(JSON.stringify(s, null, 2)); prisma.$disconnect(); }).catch(e => { console.error(e); prisma.$disconnect(); });
