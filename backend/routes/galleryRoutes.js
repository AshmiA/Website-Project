import express from "express";
import multer from "multer";
import path from "path";
import {
  getGalleries,
  createGallery,
  updateGallery,
  deleteGalleryItem,
  deleteFullGallery,
} from "../controllers/galleryController.js";

const router = express.Router();

/* ---------- MULTER CONFIG ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/gallery");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

/* ---------- ROUTES ---------- */
router.get("/", getGalleries);
router.post("/", upload.array("files"), createGallery);
router.put("/:id", upload.array("files"), updateGallery);
router.delete("/:id/item/:filename", deleteGalleryItem);
router.delete("/:id", deleteFullGallery);

export default router;
