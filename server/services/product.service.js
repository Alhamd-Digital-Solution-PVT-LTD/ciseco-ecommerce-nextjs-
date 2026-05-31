const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const remove = require("../utils/remove.util");

exports.addProduct = async (req, res) => {
  const { features, campaign, variations, ...otherInformation } = req.body;
  let thumbUrl = "https://placehold.co/296x200.png";
  let thumbId = "N/A";
  let gallery = [];

  const parsedFeatures = JSON.parse(features);
  const parsedCampaign = JSON.parse(campaign);
  const parsedVariations = JSON.parse(variations);

  if (req.files.thumbnail?.length) {
    thumbUrl = req.files.thumbnail[0].path;
    thumbId = req.files.thumbnail[0].filename;
  }

  if (req.files.gallery?.length) {
    gallery = req.files.gallery.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
  }

  const productData = {
    title: otherInformation.title,
    summary: otherInformation.summary,
    price: Number(otherInformation.price),
    features: parsedFeatures,
    campaign: parsedCampaign,
    variations: parsedVariations,
    thumbUrl,
    thumbId,
    gallery,
    categoryId: otherInformation.category,
    brandId: otherInformation.brand,
    storeId: otherInformation.store
  };

  const product = await prisma.product.create({ data: productData });

  res.status(201).json({
    acknowledgement: true,
    message: "Created",
    description: "Product created successfully",
  });
};

exports.getProducts = async (res) => {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      brand: true,
      store: true,
      buyers: true,
      reviews: {
        orderBy: { updatedAt: "desc" },
        include: {
          reviewer: true,
          product: { include: { brand: true, category: true, store: true } }
        }
      }
    }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Products fetched successfully",
    data: products,
  });
};

exports.getProduct = async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      brand: true,
      store: true,
      reviews: {
        orderBy: { updatedAt: "desc" },
        include: {
          reviewer: true,
          product: { include: { brand: true, category: true, store: true } }
        }
      }
    }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Product fetched successfully",
    data: product,
  });
};

exports.getFilteredProducts = async (req, res) => {
  try {
    let filter = {};

    if (req.query.category && req.query.category != "null") filter.categoryId = req.query.category;
    if (req.query.brand && req.query.brand != "null") filter.brandId = req.query.brand;
    if (req.query.store && req.query.store != "null") filter.storeId = req.query.store;

    const products = await prisma.product.findMany({
      where: filter,
      include: {
        category: true,
        brand: true,
        store: true,
      }
    });

    res.status(200).json({
      acknowledgement: true,
      message: "Ok",
      description: "Filtered products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      acknowledgement: false,
      message: "Internal Server Error",
      description: "Failed to fetch filtered products",
      error: error.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  
  let thumbUrl = product.thumbUrl;
  let thumbId = product.thumbId;
  let gallery = product.gallery || [];

  if (!req.body.thumbnail && req.files && req.files.thumbnail?.length > 0) {
    if (thumbId !== "N/A") await remove(thumbId);
    thumbUrl = req.files.thumbnail[0].path;
    thumbId = req.files.thumbnail[0].filename;
  }

  if (!req.body.gallery?.length > 0 && req.files && req.files.gallery?.length > 0) {
    for (let i = 0; i < gallery.length; i++) {
      if (gallery[i].public_id) await remove(gallery[i].public_id);
    }
    gallery = req.files.gallery.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
  }

  const updatedData = {
    title: req.body.title || product.title,
    summary: req.body.summary || product.summary,
    price: req.body.price ? Number(req.body.price) : product.price,
    features: req.body.features ? JSON.parse(req.body.features) : product.features,
    campaign: req.body.campaign ? JSON.parse(req.body.campaign) : product.campaign,
    variations: req.body.variations ? JSON.parse(req.body.variations) : product.variations,
    thumbUrl,
    thumbId,
    gallery,
  };

  await prisma.product.update({
    where: { id: req.params.id },
    data: updatedData
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Product updated successfully",
  });
};

exports.deleteProduct = async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });

  if (product.thumbId && product.thumbId !== "N/A") {
    await remove(product.thumbId);
  }

  if (product.gallery && product.gallery.length > 0) {
    for (let i = 0; i < product.gallery.length; i++) {
      if (product.gallery[i].public_id) await remove(product.gallery[i].public_id);
    }
  }

  // Delete associated reviews
  await prisma.review.deleteMany({ where: { productId: product.id } });
  await prisma.cart.deleteMany({ where: { productId: product.id } });
  await prisma.favorite.deleteMany({ where: { productId: product.id } });

  await prisma.product.delete({ where: { id: product.id } });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Product deleted successfully",
  });
};
