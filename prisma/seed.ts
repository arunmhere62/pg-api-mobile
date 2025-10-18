import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      password: 'hashedpassword123', // In production, use proper password hashing
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'hashedpassword456',
      role: 'ADMIN',
    },
  });

  // Create posts
  await prisma.post.createMany({
    data: [
      {
        title: 'Getting Started with NestJS',
        content: 'NestJS is a progressive Node.js framework...',
        published: true,
        authorId: user1.id,
      },
      {
        title: 'Introduction to Prisma',
        content: 'Prisma is a next-generation ORM...',
        published: true,
        authorId: user1.id,
      },
      {
        title: 'Draft Post',
        content: 'This is a draft post...',
        published: false,
        authorId: user2.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
