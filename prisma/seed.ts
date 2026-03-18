import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
async function main() {
  await prisma.user.deleteMany();
  const now = new Date();
  await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
    },
  });
  await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob',
    },
  });
  console.log('Seed completed');
}
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
