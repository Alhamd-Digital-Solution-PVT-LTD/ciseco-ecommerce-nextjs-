const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// get all purchases
async function getAllPurchases(res) {
  const purchases = await prisma.purchase.findMany({
    include: {
      customer: true,
      products: {
        include: {
          product: true
        }
      }
    }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Purchases fetched successfully",
    data: purchases,
  });
}

// update purchase status
async function updatePurchaseStatus(req, res) {
  await prisma.purchase.update({
    where: { id: req.params.id },
    data: { status: req.body.status }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Purchase status updated successfully",
  });
}

module.exports = {
  getAllPurchases,
  updatePurchaseStatus,
};
