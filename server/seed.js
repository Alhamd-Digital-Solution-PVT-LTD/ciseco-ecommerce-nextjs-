const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // Hash passwords
  const salt = bcrypt.genSaltSync(10);
  const hashAdmin = bcrypt.hashSync('Admin@123', salt);
  const hashSeller = bcrypt.hashSync('Hasib@123', salt);
  const hashBuyer = bcrypt.hashSync('Demo@123', salt);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashAdmin },
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashAdmin,
      phone: '+8801900000001',
      role: 'admin',
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'devhasibulislam@gmail.com' },
    update: { password: hashSeller },
    create: {
      name: 'Hasibul Islam',
      email: 'devhasibulislam@gmail.com',
      password: hashSeller,
      phone: '+8801900000002',
      role: 'seller',
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: { password: hashBuyer },
    create: {
      name: 'Demo Buyer',
      email: 'demo@example.com',
      password: hashBuyer,
      phone: '+8801900000003',
      role: 'buyer',
    },
  });

  // Categories
  const electronics = await prisma.category.upsert({
    where: { title: 'Electronics' },
    update: {},
    create: {
      title: 'Electronics',
      description: 'Gadgets and electronic devices',
      creatorId: admin.id,
    },
  });

  // Brands
  const techBrand = await prisma.brand.upsert({
    where: { title: 'TECHCORP' },
    update: {},
    create: {
      title: 'TECHCORP',
      description: 'A leading tech brand',
      creatorId: admin.id,
    },
  });

  // Stores
  const techStore = await prisma.store.upsert({
    where: { title: 'Tech Haven' },
    update: {},
    create: {
      title: 'Tech Haven',
      description: 'The best place for tech',
      ownerId: seller.id,
    },
  });

  // Products with local image URLs
  const p1 = await prisma.product.upsert({
    where: { title: 'Super Smartphone X' },
    update: { thumbUrl: '/products/smartphone.png' },
    create: {
      title: 'Super Smartphone X',
      summary: 'The latest and greatest smartphone.',
      price: 999.99,
      thumbUrl: '/products/smartphone.png',
      categoryId: electronics.id,
      brandId: techBrand.id,
      storeId: techStore.id,
      features: [{ title: 'Battery', content: ['Lasts all day'] }],
    },
  });

  const p2 = await prisma.product.upsert({
    where: { title: 'Ultra Thin Laptop Pro' },
    update: { thumbUrl: '/products/laptop.png' },
    create: {
      title: 'Ultra Thin Laptop Pro',
      summary: 'Powerful laptop for professionals.',
      price: 1499.99,
      thumbUrl: '/products/laptop.png',
      categoryId: electronics.id,
      brandId: techBrand.id,
      storeId: techStore.id,
      features: [{ title: 'Performance', content: ['Incredible speed'] }],
    },
  });

  const p3 = await prisma.product.upsert({
    where: { title: 'Noise Cancelling Headphones' },
    update: { thumbUrl: '/products/headphones.png' },
    create: {
      title: 'Noise Cancelling Headphones',
      summary: 'Immersive sound experience.',
      price: 299.99,
      thumbUrl: '/products/headphones.png',
      categoryId: electronics.id,
      brandId: techBrand.id,
      storeId: techStore.id,
      features: [{ title: 'Audio', content: ['Deep bass'] }],
    },
  });

  console.log('Database seeded with dummy data, including specific logins and local product images!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
