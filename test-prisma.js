const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.orderStatusType.findMany().then(console.log).catch(console.error);
