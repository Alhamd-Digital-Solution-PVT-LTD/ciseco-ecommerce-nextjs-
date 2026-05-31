const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.addToCart = async (req, res) => {
  const isExist = await prisma.cart.findFirst({
    where: { productId: req.body.product, userId: req.user._id }
  });

  if (isExist) {
    return res.status(409).json({
      acknowledgement: false,
      message: "Conflict",
      description: "Product already in cart",
    });
  }

  await prisma.cart.create({
    data: {
      productId: req.body.product,
      userId: req.user._id,
      quantity: 1
    }
  });

  res.status(201).json({
    acknowledgement: true,
    message: "Created",
    description: "Product added to cart",
  });
};

exports.getCarts = async (req, res) => {
  const carts = await prisma.cart.findMany({
    where: { userId: req.user._id },
    include: { product: true }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: "Cart retrieved successfully",
    data: carts,
  });
};

exports.updateCart = async (req, res) => {
  await prisma.cart.update({
    where: { id: req.params.id },
    data: { quantity: req.body.quantity }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: "Cart updated successfully",
  });
};

exports.deleteCart = async (req, res) => {
  await prisma.cart.delete({
    where: { id: req.params.id }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: "Product removed from cart",
  });
};
