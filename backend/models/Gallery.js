import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  url: String,
  type: String,
  name: String,
  uploadedAt: { type: Date, default: Date.now },
});

const gallerySchema = new mongoose.Schema({
  title: String,
  items: [itemSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Gallery", gallerySchema);
