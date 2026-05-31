const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.createPayment = async (req, res) => {
  const lineItems = req.body.map((item) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.thumbnail],
          description: item.description,
          metadata: {
            id: item.pid,
          },
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.ORIGIN_URL}`,
    cancel_url: `${process.env.ORIGIN_URL}`,
  });

  // create purchase for user
  const purchase = await prisma.purchase.create({
    data: {
      customerId: req.user._id,
      stripeCusId: session.id,
      orderId: session.id,
      totalAmount: session.amount_total,
      products: {
        create: req.body.map((item) => ({
          productId: item.pid,
          quantity: item.quantity,
        }))
      }
    }
  });

  // Since we don't have separate arrays on User model anymore,
  // the purchase is automatically linked to the user via customerId.

  // empty user's cart
  const cartIds = req.body.map(cart => cart.cid);
  await prisma.cart.deleteMany({
    where: { id: { in: cartIds } }
  });

  // add user to products buyers array is handled automatically by the ProductBuyers relation
  // We need to connect the user to each product's buyers array.
  for (const product of req.body) {
    await prisma.product.update({
      where: { id: product.pid },
      data: {
        buyers: {
          connect: { id: req.user._id }
        }
      }
    });
  }

  res.status(201).json({
    acknowledgement: true,
    message: "Ok",
    description: "Payment created successfully",
    url: session.url,
  });
};
