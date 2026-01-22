import Gallery from "../models/Gallery.js";
import path from "path";
import fs from "fs";

// FOLDER WHERE GALLERY FILES ARE STORED
const GALLERY_DIR = path.join(process.cwd(), "uploads", "gallery");

// Ensure gallery folder exists
if (!fs.existsSync(GALLERY_DIR)) {
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
}

/* -----------------------------------------------------
   GET ALL GALLERIES
----------------------------------------------------- */
export const getGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    res.json(galleries);
  } catch (err) {
    res.status(500).json({ message: "Failed to load galleries" });
  }
};

/* -----------------------------------------------------
   CREATE NEW GALLERY
----------------------------------------------------- */
export const createGallery = async (req, res) => {
  try {
    const title = req.body.title || "";
    const files = req.files || [];

    const items = files.map((f) => ({
      url: `/uploads/gallery/${f.filename}`,
      type: f.mimetype.includes("video") ? "video" : "image",
      name: f.originalname,
    }));

    const gallery = await Gallery.create({ title, items });

    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: "Failed to create gallery" });
  }
};

/* -----------------------------------------------------
   UPDATE GALLERY (TITLE + ADD NEW FILES)
----------------------------------------------------- */
export const updateGallery = async (req, res) => {
  try {
    const id = req.params.id;
    const title = req.body.title;
    const files = req.files || [];

    const gallery = await Gallery.findById(id);

    if (!gallery) return res.status(404).json({ message: "Not found" });

    if (title !== undefined) gallery.title = title;

    // Append new files (old ones remain)
    const newItems = files.map((f) => ({
      url: `/uploads/gallery/${f.filename}`,
      type: f.mimetype.includes("video") ? "video" : "image",
      name: f.originalname,
    }));

    gallery.items = [...gallery.items, ...newItems];

    await gallery.save();
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: "Failed to update gallery" });
  }
};

/* -----------------------------------------------------
   DELETE A SINGLE ITEM FROM GALLERY
----------------------------------------------------- */
export const deleteGalleryItem = async (req, res) => {
  try {
    const { id, filename } = req.params;

    const gallery = await Gallery.findById(id);
    if (!gallery) return res.status(404).json({ message: "Not found" });

    // Remove from DB
    gallery.items = gallery.items.filter(
      (item) => item.url.split("/").pop() !== filename
    );

    await gallery.save();

    // Delete file from storage
    const filePath = path.join(GALLERY_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete item" });
  }
};

/* -----------------------------------------------------
   DELETE FULL GALLERY
----------------------------------------------------- */
export const deleteFullGallery = async (req, res) => {
  try {
    const { id } = req.params;

    const gallery = await Gallery.findById(id);
    if (!gallery) return res.status(404).json({ message: "Not found" });

    // Delete all files from storage
    gallery.items.forEach((item) => {
      const filename = item.url.split("/").pop();
      const filePath = path.join(GALLERY_DIR, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await Gallery.findByIdAndDelete(id);

    res.json({ message: "Gallery deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete gallery" });
  }
};
