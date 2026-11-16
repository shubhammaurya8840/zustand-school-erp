const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const books = await p.book.findMany({ include: { issues: true } });
  console.log('TOTAL BOOKS:', books.length);
  console.log(JSON.stringify(books, null, 2));
}

main().catch(console.error).finally(() => p.$disconnect());

