require("dotenv").config();
const mongoose = require("mongoose");
const { PrismaClient } = require("@prisma/client");

// Import Mongoose Models
const User = require("./models/user.model");
const Product = require("./models/product.model");
const Category = require("./models/category.model");
const Store = require("./models/store.model");
const Brand = require("./models/brand.model");
const Review = require("./models/review.model");
const Purchase = require("./models/purchase.model");
const Cart = require("./models/cart.model");
const Favorite = require("./models/favorite.model");

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.DB_Name,
    });
    console.log("Connected to MongoDB");

    console.log("Connecting to MySQL...");
    await prisma.$connect();
    console.log("Connected to MySQL");

    // 1. Migrate Users
    console.log("Migrating Users...");
    const mongoUsers = await User.find({});
    for (const u of mongoUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          password: u.password,
          avatarUrl: u.avatar?.url || "https://placehold.co/300x300.png",
          avatarId: u.avatar?.public_id || "N/A",
          phone: u.phone,
          role: u.role,
          status: u.status,
          address: u.address,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        },
      });
    }

    // 2. Migrate Categories
    console.log("Migrating Categories...");
    const mongoCategories = await Category.find({});
    for (const c of mongoCategories) {
      await prisma.category.upsert({
        where: { id: c._id.toString() },
        update: {},
        create: {
          id: c._id.toString(),
          title: c.title,
          description: c.description,
          thumbUrl: c.thumbnail?.url || "https://placehold.co/296x200.png",
          thumbId: c.thumbnail?.public_id || "N/A",
          keynotes: c.keynotes,
          tags: c.tags,
          creatorId: c.creator ? c.creator.toString() : null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        },
      });
    }

    // 3. Migrate Stores
    console.log("Migrating Stores...");
    const mongoStores = await Store.find({});
    for (const s of mongoStores) {
      await prisma.store.upsert({
        where: { id: s._id.toString() },
        update: {},
        create: {
          id: s._id.toString(),
          title: s.title,
          description: s.description,
          thumbUrl: s.thumbnail?.url || "https://placehold.co/296x200.png",
          thumbId: s.thumbnail?.public_id || "N/A",
          status: s.status,
          keynotes: s.keynotes,
          tags: s.tags,
          ownerId: s.owner ? s.owner.toString() : null,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        },
      });
    }

    // 4. Migrate Brands
    console.log("Migrating Brands...");
    const mongoBrands = await Brand.find({});
    for (const b of mongoBrands) {
      await prisma.brand.upsert({
        where: { id: b._id.toString() },
        update: {},
        create: {
          id: b._id.toString(),
          title: b.title,
          description: b.description,
          logoUrl: b.logo?.url || "https://placehold.co/296x200.png",
          logoId: b.logo?.public_id || "N/A",
          keynotes: b.keynotes,
          tags: b.tags,
          creatorId: b.creator ? b.creator.toString() : null,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        },
      });
    }

    // 5. Migrate Products
    console.log("Migrating Products...");
    const mongoProducts = await Product.find({});
    for (const p of mongoProducts) {
      await prisma.product.upsert({
        where: { id: p._id.toString() },
        update: {},
        create: {
          id: p._id.toString(),
          title: p.title,
          summary: p.summary,
          thumbUrl: p.thumbnail?.url || "https://placehold.co/296x200.png",
          thumbId: p.thumbnail?.public_id || "N/A",
          price: p.price,
          gallery: p.gallery,
          features: p.features,
          variations: p.variations,
          campaign: p.campaign,
          categoryId: p.category ? p.category.toString() : null,
          brandId: p.brand ? p.brand.toString() : null,
          storeId: p.store ? p.store.toString() : null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        },
      });

      // Connect buyers
      for (const buyerId of p.buyers || []) {
        try {
          await prisma.product.update({
            where: { id: p._id.toString() },
            data: { buyers: { connect: { id: buyerId.toString() } } },
          });
        } catch (e) {
          console.warn(`Buyer ${buyerId} not found for product ${p.title}`);
        }
      }
    }

    // 6. Migrate Reviews
    console.log("Migrating Reviews...");
    const mongoReviews = await Review.find({});
    for (const r of mongoReviews) {
      await prisma.review.upsert({
        where: { id: r._id.toString() },
        update: {},
        create: {
          id: r._id.toString(),
          rating: r.rating,
          comment: r.comment,
          reviewerId: r.reviewer ? r.reviewer.toString() : null,
          productId: r.product ? r.product.toString() : null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
      });
    }

    // 7. Migrate Purchases
    console.log("Migrating Purchases...");
    const mongoPurchases = await Purchase.find({});
    for (const pur of mongoPurchases) {
      await prisma.purchase.upsert({
        where: { id: pur._id.toString() },
        update: {},
        create: {
          id: pur._id.toString(),
          customerId: pur.customer.toString(),
          stripeCusId: pur.customerId,
          orderId: pur.orderId,
          totalAmount: pur.totalAmount,
          status: pur.status,
          createdAt: pur.createdAt,
          updatedAt: pur.updatedAt,
        },
      });

      // Handle Purchase Products
      for (const prod of pur.products || []) {
        if (prod.product) {
          await prisma.purchaseProduct.create({
            data: {
              purchaseId: pur._id.toString(),
              productId: prod.product.toString(),
              quantity: prod.quantity,
            },
          });
        }
      }
    }

    // 8. Migrate Cart
    console.log("Migrating Cart...");
    const mongoCart = await Cart.find({});
    for (const c of mongoCart) {
      await prisma.cart.upsert({
        where: { id: c._id.toString() },
        update: {},
        create: {
          id: c._id.toString(),
          quantity: c.quantity,
          userId: c.user ? c.user.toString() : null,
          productId: c.product ? c.product.toString() : null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        },
      });
    }

    // 9. Migrate Favorites
    console.log("Migrating Favorites...");
    const mongoFavorites = await Favorite.find({});
    for (const f of mongoFavorites) {
      await prisma.favorite.upsert({
        where: { id: f._id.toString() },
        update: {},
        create: {
          id: f._id.toString(),
          userId: f.user ? f.user.toString() : null,
          productId: f.product ? f.product.toString() : null,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        },
      });
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
}

migrate();
