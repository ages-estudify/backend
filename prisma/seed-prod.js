const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('Estudify@Admin2026', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@estudify.com' },
    update: {},
    create: {
      email: 'admin@estudify.com',
      password: passwordHash,
      role: Role.ADM,
      full_name: 'Administrador',
      plan_end_date: new Date('2030-12-31'),
      phone_number: '51911111111',
    },
  });

  console.log('🚀 Seed de produção executado. Admin garantido:', admin.email);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed de produção:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
