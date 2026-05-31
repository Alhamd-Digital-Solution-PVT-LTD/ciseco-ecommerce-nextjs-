const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.addToFavorite = async (req, res) => {
  const { product } = req.body;

  const isExist = await prisma.favorite.findFirst({
    where: { productId: product, userId: req.user._id }
  });

  if (isExist) {
    return res.status(409).json({
      acknowledgement: false,
      message: "Conflict",
      description: "Product already in favorite",
    });
  }

  await prisma.favorite.create({
    data: {
      userId: req.user._id,
      productId: product,
    }
  });

  res.status(201).json({
    acknowledgement: true,
    message: "Ok",
    description: "Product added to favorite successfully",
  });
};

exports.getFavorites = async (res) => {
  const favorites = await prisma.favorite.findMany({
    include: { product: true, user: true }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Favorite retrieved successfully",
    data: favorites,
  });
};

exports.deleteFromFavorite = async (req, res) => {
  await prisma.favorite.delete({
    where: { id: req.params.id }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Product deleted from favorite successfully",
  });
};
