const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");

//1, set up dotend//
require("dotenv/config");

//2, dotend allow env variable
const api = process.env.API_URL;

//router set up 1//
const productRouter = require("./routers/products");
const categoriesRouter = require("./routers/categories");
const usersRouter = require("./routers/users");
const ordersRouter = require("./routers/orders");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/errHandler");

//set up cors for allowing fontend access//
app.use(cors());
app.options("*", cors());

//middleware//
app.use(bodyParser.json());
app.use(morgan("tiny"));
//backend will understand json which is sent from fontend//
app.use(authJwt());
app.use(errorHandler);
//handling authentication error//

//defining the the image file in public/uploads as static folder//
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

//router set up 2//
app.use(`${api}/products`, productRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, ordersRouter);

mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(() => console.log("Database connection is ready"))
  .catch((err) => {
    console.log(err);
  });

app.listen(3000, () => {
  console.log("server is running on http://localhost:3000");
});
