const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const remove = require("../utils/remove.util");

/* add new store */
exports.addStore = async (req, res) => {
  const { body, file } = req;

  const storeData = {
    title: body.title,
    description: body.description,
    keynotes: JSON.parse(body.keynotes),
    tags: JSON.parse(body.tags),
    ownerId: req.user._id,
  };

  if (file) {
    storeData.thumbUrl = file.path;
    storeData.thumbId = file.filename;
  }

  await prisma.store.create({ data: storeData });

  res.status(201).json({
    acknowledgement: true,
    message: "Created",
    description: "Store created successfully",
  });
};

/* get all stores */
exports.getStores = async (res) => {
  const stores = await prisma.store.findMany({
    include: {
      owner: true,
      products: {
        include: {
          category: true,
          brand: true,
          store: true
        }
      }
    }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Stores fetched successfully",
    data: stores,
  });
};

/* get a store */
exports.getStore = async (req, res) => {
  const store = await prisma.store.findUnique({
    where: { id: req.params.id }
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Store fetched successfully",
    data: store,
  });
};

/* update store */
exports.updateStore = async (req, res) => {
  const existingStore = await prisma.store.findUnique({ where: { id: req.params.id } });
  
  const updatedData = {
    title: req.body.title || existingStore.title,
    description: req.body.description || existingStore.description,
    status: req.body.status || existingStore.status,
  };

  if (!req.body.thumbnail && req.file) {
    if (existingStore.thumbId && existingStore.thumbId !== "N/A") {
      await remove(existingStore.thumbId);
    }
    updatedData.thumbUrl = req.file.path;
    updatedData.thumbId = req.file.filename;
  }

  if (req.body.keynotes) updatedData.keynotes = JSON.parse(req.body.keynotes);
  if (req.body.tags) updatedData.tags = JSON.parse(req.body.tags);

  await prisma.store.update({
    where: { id: req.params.id },
    data: updatedData
  });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Store updated successfully",
  });
};

/* delete store */
exports.deleteStore = async (req, res) => {
  const store = await prisma.store.findUnique({ where: { id: req.params.id } });
  
  if (store.thumbId && store.thumbId !== "N/A") {
    await remove(store.thumbId);
  }

  await prisma.product.updateMany({
    where: { storeId: store.id },
    data: { storeId: null }
  });

  await prisma.store.delete({ where: { id: store.id } });

  res.status(200).json({
    acknowledgement: true,
    message: "Ok",
    description: "Store deleted successfully",
  });
};
