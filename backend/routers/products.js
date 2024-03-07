const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Product } = require("../models/product");
const { Category } = require("../models/category");
const multer = require("multer");

const FILE_MAP_TYPE = {
  " image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_MAP_TYPE[file.mimetype];
    let fileError = new Error("the file format is invalid");
    if (isValid) {
      fileError = null;
    }
    cb(fileError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const extenstion = FILE_MAP_TYPE[file.mimetype];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + extenstion);
  },
});

const upload = multer({ storage: storage });

// get all product
router.get(`/`, async (req, res) => {
  const productList = await Product.find().select("name image -_id");
  if (!productList) res.status(500).json({ success: false });
  res.send(productList);
});

// get one product by id
router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) res.status(500).json({ success: false });
  res.send(product);
});

// get  product count
router.get(`/get/count`, async (req, res) => {
  const productCount = await Product.countDocuments();
  if (!productCount) res.status(500).json({ success: false });
  res.status(200).send({ productCount: productCount });
});

//get featured product
router.get(`/get/featured/:count`, async (req, res) => {
  const count = Number(req.params.count ? req.params.count : 0);
  const product = await Product.find({ isFeatured: true }).limit(count);
  if (!product) res.status(500).json({ success: false });
  res.status(200).send(product);
});

//get  product of category
router.get(`/`, async (req, res) => {
  try {
    let filter = {};
    if (req.query.category) {
      filter = { category: req.query.category.split(",") };
    }
    const product = await Product.find(filter);
    if (!product) res.status(500).json({ success: false });
    res.status(200).send(product);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

//create one product
router.post(`/`, upload.single("image"), async (req, res) => {
  // if no file is uploaded ,res sent with error//
  const file = req.file;
  if (!file) res.status(400).send("no image file is uploaded");
  const imageFile = req.file.filename;
  const imagePath = `${req.protocol}://${req.get(
    "host"
  )}/public/uploads/${imageFile}`;
  try {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(404).send("Invalid Category");
  } catch {
    return res.status(500).send("Error happened");
  }
  //validate the category the category id must be in category db
  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: imagePath,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });
  try {
    product = await product.save();
    if (!product)
      return res
        .status(500)
        .json({ success: false, message: "the product cannot be created " });
    return res.status(200).send(product);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//update a product by uploading images
router.put(
  `/gallery-images/:id`,
  upload.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(500).send("Invalid Id");
    const files = req.files;
    if (!files) res.status(400).send("no image files is uploaded");
    let imagepaths = [];
    if (files) {
      imagepaths = files.map((file) => {
        return `${req.protocol}://${req.get("host")}/public/uploads/${
          file.filename
        }`;
      });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagepaths,
      },
      { new: true }
    );

    if (!product) return res.status(500).send("the product cannot be updated ");
    res.send(product);
  }
);

//update a product
router.put(`/:id`, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(500).send("Invalid Id");
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(404).send("Invalid Category");
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.imag,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );
  if (!product) return res.status(500).send("the product cannot be updated ");
  res.send(product);
});

//delete one product by id//
router.delete(`/:id`, async (req, res) => {
  Product.findOneAndDelete({ _id: req.params.id })
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "the product is deleted!" });
      } else
        return res
          .status(404)
          .json({ success: false, message: "product is not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
