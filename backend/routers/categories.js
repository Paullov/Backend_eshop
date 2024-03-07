const express = require("express");
const router = express.Router();
const { Category } = require("../models/category");

//get all category//
router.get(`/`, async (req, res) => {
  const categoryList = await Category.find();
  if (!categoryList) res.status(500).json({ success: false });
  res.status(200).send(categoryList);
});

//get one category by id//
router.get(`/:id`, async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category)
    res.status(404).json({
      success: false,
      message: "the category with given id is not found",
    });
  res.status(200).send(category);
});

//post one category //
router.post(`/`, async (req, res) => {
  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });

  category = await category.save();
  if (!category) return res.status(404).send("the category cannot be created ");
  res.status(200).send(category);
});

router.put(`/:id`, async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    },
    { new: true }
  );
  if (!category) return res.status(404).send("the category cannot be updated ");
  res.send(category);
});

//delete one category by id//
router.delete(`/:id`, async (req, res) => {
  Category.findOneAndDelete({ _id: req.params.id })
    .then((category) => {
      if (category) {
        return res
          .status(200)
          .json({ success: true, message: "the category is deleted!" });
      } else
        return res
          .status(404)
          .json({ success: false, message: "category is not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
