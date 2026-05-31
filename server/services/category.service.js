const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const remove = require("../utils/remove.util");

exports.addCategory = async (req, res) => {
  const existingCat = await prisma.category.findFirst({ where: { title: req.body.title } });

  if (existingCat) {
    return res.status(409).json({
      acknowledgement: false,
      message: "Conflict",
      description: "Category already exists",
    });
  }

  const catData = { ...req.body, creatorId: req.user._id };
  if (req.file) {
    catData.thumbUrl = req.file.path;
    catData.thumbId = req.file.filename;
  }

  if (catData.title) {
    catData.title = catData.title.toLowerCase().split(" ").map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(" ");
  }
  if (catData.tags) {
    catData.tags = catData.tags.map(tag => tag.replace(" ", "-").toLowerCase());
  }

  const category = await prisma.category.create({ data: catData });

  res.status(201).json({
    acknowledgement: true,
    message: "Created",
    description: "Category created successfully",
    data: category
  });
};

exports.getCategories = async (res) => {
  const categories = await prisma.category.findMany({ include: { creator: true } });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: "Categories retrieved successfully",
    data: categories,
  });
};

exports.getCategory = async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { creator: true, products: true }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: `${category.title}'s information retrieved successfully`,
    data: category,
  });
};

exports.updateCategory = async (req, res) => {
  const existingCat = await prisma.category.findUnique({ where: { id: req.params.id } });
  const catData = { ...req.body };

  if (!req.body.thumbnail && req.file) {
    await remove(existingCat.thumbId);
    catData.thumbUrl = req.file.path;
    catData.thumbId = req.file.filename;
  }

  if (catData.title) {
    catData.title = catData.title.toLowerCase().split(" ").map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(" ");
  }
  if (catData.tags) {
    catData.tags = catData.tags.map(tag => tag.replace(" ", "-").toLowerCase());
  }

  const updatedCat = await prisma.category.update({
    where: { id: existingCat.id },
    data: catData
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: `${updatedCat.title}'s information updated successfully`,
  });
};

exports.deleteCategory = async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { products: true }
  });

  await remove(category.thumbId);

  for (const prod of category.products) {
    await prisma.product.delete({ where: { id: prod.id } });
  }

  await prisma.category.delete({ where: { id: category.id } });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: `${category.title}'s information deleted successfully`,
  });
};
