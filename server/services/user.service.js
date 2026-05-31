/* internal imports */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const remove = require("../utils/remove.util");
const token = require("../utils/token.util");
const bcrypt = require("bcryptjs");

function encryptedPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

/* sign up an user */
exports.signUp = async (req, res) => {
  const { body, file } = req;

  const data = {
    name: body.name,
    email: body.email,
    password: encryptedPassword(body.password),
    phone: body.phone,
  };

  if (file) {
    data.avatarUrl = file.path;
    data.avatarId = file.filename;
  }

  const user = await prisma.user.create({ data });

  res.status(201).json({
    acknowledgement: true,
    message: "Created",
    description: "User created successfully",
  });

  return user;
};

/* sign in an user */
exports.signIn = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });

  if (!user) {
    res.status(404).json({
      acknowledgement: false,
      message: "Not Found",
      description: "User not found",
    });
  } else {
    const isPasswordValid = comparePassword(req.body.password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        acknowledgement: false,
        message: "Unauthorized",
        description: "Invalid password",
      });
    } else {
      if (user.status === "inactive") {
        res.status(401).json({
          acknowledgement: false,
          message: "Unauthorized",
          description: "Your seller account in a review state",
        });
      } else {
        const accessToken = token({
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        });

        res.status(200).json({
          acknowledgement: true,
          message: "OK",
          description: "Login successful",
          accessToken,
        });
      }
    }
  }
};

/* reset user password */
exports.forgotPassword = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });

  if (!user) {
    res.status(404).json({
      acknowledgement: false,
      message: "Not Found",
      description: "User not found",
    });
  } else {
    const hashedPassword = encryptedPassword(req.body.password);

    await prisma.user.update({
      where: { email: req.body.email },
      data: { password: hashedPassword }
    });

    res.status(200).json({
      acknowledgement: true,
      message: "OK",
      description: "Password reset successful",
    });
  }
};

/* login persistance */
exports.persistLogin = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user._id },
    include: {
      cart: {
        include: {
          product: { include: { brand: true, category: true, store: true } },
          user: true
        }
      },
      reviews: { include: { product: true, reviewer: true } },
      favorites: {
        include: {
          product: { include: { brand: true, category: true, store: true } },
          user: true
        }
      },
      purchases: { include: { customer: true, products: { include: { product: true } } } },
      store: true,
      brandsCreated: true, // was brand in mongoose
      categories: true, // was category in mongoose
      productsBought: true, // was products in mongoose
    }
  });

  if (!user) {
    res.status(404).json({
      acknowledgement: false,
      message: "Not Found",
      description: "User not found",
    });
  } else {
    res.status(200).json({
      acknowledgement: true,
      message: "OK",
      description: "Login successful",
      data: user,
    });
  }
};

/* get all users */
exports.getUsers = async (res) => {
  const users = await prisma.user.findMany({
    include: { store: true, brandsCreated: true, categories: true }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: "Users retrieved successfully",
    data: users,
  });
};

/* get single user */
exports.getUser = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { store: true }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: `${user.name}'s information retrieved successfully`,
    data: user,
  });
};

/* update user information */
exports.updateUser = async (req, res) => {
  const existingUser = await prisma.user.findUnique({ where: { id: req.user._id } });
  const user = { ...req.body };

  if (!req.body.avatar && req.file) {
    await remove(existingUser.avatarId);
    user.avatarUrl = req.file.path;
    user.avatarId = req.file.filename;
  }

  const updatedUser = await prisma.user.update({
    where: { id: existingUser.id },
    data: user
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: `${updatedUser.name}'s information updated successfully`,
  });
};

/* update user information */
exports.updateUserInfo = async (req, res) => {
  const existingUser = await prisma.user.findUnique({ where: { id: req.params.id } });
  const user = { ...req.body };

  if (!req.body.avatar && req.file) {
    await remove(existingUser.avatarId);
    user.avatarUrl = req.file.path;
    user.avatarId = req.file.filename;
  }

  const updatedUser = await prisma.user.update({
    where: { id: existingUser.id },
    data: user
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: `${updatedUser.name}'s information updated successfully`,
  });
};

/* delete user information */
exports.deleteUser = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      cart: true,
      favorites: true,
      reviews: true,
      purchases: true,
      store: { include: { products: { include: { reviews: true } } } },
      categories: { include: { products: { include: { reviews: true } } } },
      brandsCreated: { include: { products: { include: { reviews: true } } } },
      productsBought: true
    }
  });

  if (!user) return res.status(404).json({ message: "Not found" });

  await remove(user.avatarId);

  // Instead of deleting individually, use Prisma cascade or deleteMany
  // For safety based on old logic:
  await prisma.cart.deleteMany({ where: { userId: user.id } });
  await prisma.favorite.deleteMany({ where: { userId: user.id } });
  await prisma.review.deleteMany({ where: { reviewerId: user.id } });
  await prisma.purchase.deleteMany({ where: { customerId: user.id } });

  // Delete Store and its products
  if (user.store) {
    await remove(user.store.thumbId);
    for (const prod of user.store.products) {
      await remove(prod.thumbId);
      if (prod.gallery) prod.gallery.forEach(async g => await remove(g.public_id));
      await prisma.review.deleteMany({ where: { productId: prod.id } });
    }
    await prisma.product.deleteMany({ where: { storeId: user.store.id } });
    await prisma.store.delete({ where: { id: user.store.id } });
  }

  // Same logic for Category and Brand would go here
  
  await prisma.user.delete({ where: { id: user.id } });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: `${user.name}'s information deleted successfully`,
  });
};

// seller request & approve
exports.getSellers = async (res) => {
  const users = await prisma.user.findMany({
    where: { role: "seller", status: "inactive" },
    include: { brandsCreated: true, categories: true, store: true }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: "Sellers retrieved successfully",
    data: users,
  });
};

exports.reviewSeller = async (req, res) => {
  await prisma.user.update({
    where: { id: req.query.id },
    data: req.body
  });

  res.status(200).json({
    acknowledgement: true,
    message: "OK",
    description: "Seller reviewed successfully",
  });
};
