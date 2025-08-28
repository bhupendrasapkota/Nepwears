import express from "express";
import config from "./config/config.js";
import connectDB from "./config/database.js";
import bodyParser from "body-parser";
import cors from "cors";

//Cloudinary
import connectCloudinary from "./config/cloudinary.js";

//Middleware
import upload from "./middlewares/multer.js";

import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import variantRoute from "./routes/variantRoute.js";
import collectionRoute from "./routes/collectionRoute.js";
import cartRoute from "./routes/cartRoute.js";
import addressRoute from "./routes/addressRoute.js";
import orderRoute from "./routes/orderRoute.js";
import paymentRoute from "./routes/paymentRoute.js";
import reviewRoute from "./routes/reviewRoute.js";

const app = express();

app.use(cors());
connectDB();
connectCloudinary();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);

app.use("/api/products", upload.productUpload, productRoute);
app.use("/api/variants", upload.productUpload, variantRoute);
app.use("/api/collections", upload.collectionUpload, collectionRoute);
app.use("/api/carts", cartRoute);
app.use("/api/addresses", addressRoute);
app.use("/api/orders", orderRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/reviews", reviewRoute);

app.get("/", (req, res) => {
  res.json({
    status: "Ok",
    name: "Nepwears API",
    version: "1.0.0",
    Time: new Date().toISOString(),
  });
});

export default app;
