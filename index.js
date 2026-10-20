const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());

// MongoDB CONNECT
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected 🚀"))
  .catch((err) => console.log("DB Error:", err));

app.get("/", (req, res) => {
  res.send("MobileMate POS Running 🚀");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});