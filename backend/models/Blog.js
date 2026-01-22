import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    // Remove slug field if it exists, or make it optional
    slug: {
      type: String,
      unique: false, // Change from true to false
      sparse: true, // Allows null values
    },
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema);