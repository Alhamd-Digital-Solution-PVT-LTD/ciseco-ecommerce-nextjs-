const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const remove = require("../utils/remove.util");

exports.addBrand = async (req, res) => {
  const existingBrand = await prisma.brand.findFirst({ where: { title: req.body.title } });

  if (existingBrand) {
    return res.status(409).json({
      acknowledgement: false,
      message: "Conflict",
      description: "Brand already exists",
    });
  }

  const brandData = { ...req.body, creatorId: req.user._id };
  if (req.file) {
    brandData.logoUrl = req.file.path;
    brandData.logoId = req.file.filename;
  }

  // Handle title capitalization and tags hyphenation before saving
  if (brandData.title) {
    brandData.title = brandData.title.toLowerCase().split(" ").map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(" ");
  }
  if (brandData.tags) {
    brandData.tags = brandData.tags.map(tag => tag.replace(" ", "-").toLowerCase());
  }

  const brand = await prisma.brand.create({ data: brandData });

  res.status(201).json({
    acknowledgement: true,
    message: "Created",
    description: "Brand created successfully",
    data: brand
  });
};

exports.getBrands = async (res) => {
  const brands = await prisma.brand.findMany({ include: { creator: true } });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: "Brands retrieved successfully",
    data: brands,
  });
};

exports.getBrand = async (req, res) => {
  const brand = await prisma.brand.findUnique({
    where: { id: req.params.id },
    include: { creator: true, products: true }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: `${brand.title}'s information retrieved successfully`,
    data: brand,
  });
};

exports.updateBrand = async (req, res) => {
  const existingBrand = await prisma.brand.findUnique({ where: { id: req.params.id } });
  const brandData = { ...req.body };

  if (!req.body.logo && req.file) {
    await remove(existingBrand.logoId);
    brandData.logoUrl = req.file.path;
    brandData.logoId = req.file.filename;
  }

  if (brandData.title) {
    brandData.title = brandData.title.toLowerCase().split(" ").map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(" ");
  }
  if (brandData.tags) {
    brandData.tags = brandData.tags.map(tag => tag.replace(" ", "-").toLowerCase());
  }

  const updatedBrand = await prisma.brand.update({
    where: { id: existingBrand.id },
    data: brandData
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: `${updatedBrand.title}'s information updated successfully`,
  });
};

exports.deleteBrand = async (req, res) => {
  const brand = await prisma.brand.findUnique({
    where: { id: req.params.id },
    include: { products: true }
  });

  await remove(brand.logoId);

  // Instead of deleting the products, we can disconnect or delete them.
  // The old code deleted the products and their thumbnails/galleries/reviews.
  for (const prod of brand.products) {
    await prisma.product.delete({ where: { id: prod.id } });
  }

  await prisma.brand.delete({ where: { id: brand.id } });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: `${brand.title}'s information deleted successfully`,
  });
};
