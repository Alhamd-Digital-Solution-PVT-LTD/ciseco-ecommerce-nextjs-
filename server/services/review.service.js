const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* add to review */
exports.addReview = async (req, res) => {
  const { product, rating, comment } = req.body;

  const productExists = await prisma.product.findFirst({
    where: {
      id: product,
      buyers: {
        some: { id: req.user._id }
      }
    }
  });

  if (!productExists) {
    return res.status(400).json({
      acknowledgement: false,
      message: "Bad Request",
      description: "Purchase this to place a review",
    });
  }

  await prisma.review.create({
    data: {
      reviewerId: req.user._id,
      productId: product,
      rating: rating,
      comment: comment,
    }
  });

  res.status(201).json({
    acknowledgement: true,
    message: "Ok",
    description: "Review added successfully",
  });
};

/* get from review */
exports.getReviews = async (res) => {
  const reviews = await prisma.review.findMany({
    orderBy: { updatedAt: "asc" }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Review fetched successfully",
    data: reviews,
  });
};

/* update review */
exports.updateReview = async (req, res) => {
  await prisma.review.update({
    where: { id: req.params.id },
    data: req.body
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Review updated successfully",
  });
};

/* delete review */
exports.deleteReview = async (req, res) => {
  await prisma.review.delete({
    where: { id: req.params.id }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Review deleted successfully",
  });
};
