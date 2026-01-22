import express from "express";
import Blog from "../models/Blog.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import slugify from "slugify";

const router = express.Router();

/* -------------------- MULTER CONFIG -------------------- */
const uploadsDir = path.join(process.cwd(), "uploads");
const blogsDir = path.join(uploadsDir, "blogs");

if (!fs.existsSync(blogsDir)) {
  fs.mkdirSync(blogsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, blogsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/* -------------------- CREATE BLOG -------------------- */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    console.log("Creating blog...", req.body);

    if (!req.body.title || !req.body.content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Generate slug from title
    const slug = slugify(req.body.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    const blog = new Blog({
      title: req.body.title,
      content: req.body.content,
      image: `/uploads/blogs/${req.file.filename}`,
      slug: slug, // Add slug field
    });

    await blog.save();
    console.log("Blog created:", blog);
    
    res.status(201).json(blog);
  } catch (err) {
    console.error("Create blog error:", err);
    
    // Handle duplicate slug error
    if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
      // Generate a unique slug with timestamp
      const uniqueSlug = slugify(req.body.title, {
        lower: true,
        strict: true,
      }) + '-' + Date.now();
      
      try {
        const blog = new Blog({
          title: req.body.title,
          content: req.body.content,
          image: `/uploads/blogs/${req.file.filename}`,
          slug: uniqueSlug,
        });
        
        await blog.save();
        return res.status(201).json(blog);
      } catch (retryErr) {
        console.error("Retry create blog error:", retryErr);
        return res.status(500).json({ error: "Failed to create blog after retry" });
      }
    }
    
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/* -------------------- GET ALL BLOGS -------------------- */
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error("Get blogs error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/* -------------------- GET SINGLE BLOG -------------------- */
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    
    res.json(blog);
  } catch (err) {
    console.error("Get blog error:", err);
    
    if (err.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid blog ID" });
    }
    
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/* -------------------- UPDATE BLOG -------------------- */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Update fields
    blog.title = req.body.title || blog.title;
    blog.content = req.body.content || blog.content;
    
    // Update slug if title changed
    if (req.body.title && req.body.title !== blog.title) {
      blog.slug = slugify(req.body.title, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
    }

    // Update image if new one is uploaded
    if (req.file) {
      // Delete old image file if exists
      if (blog.image) {
        const oldImagePath = path.join(process.cwd(), blog.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      blog.image = `/uploads/blogs/${req.file.filename}`;
    }

    await blog.save();
    res.json(blog);
  } catch (err) {
    console.error("Update blog error:", err);
    
    if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
      // Handle duplicate slug on update
      return res.status(400).json({ 
        error: "A blog with similar title already exists. Please choose a different title." 
      });
    }
    
    if (err.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid blog ID" });
    }
    
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/* -------------------- DELETE BLOG -------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Delete image file if exists
    if (blog.image) {
      const imagePath = path.join(process.cwd(), blog.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Blog.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: "Blog deleted successfully" 
    });
  } catch (err) {
    console.error("Delete blog error:", err);
    
    if (err.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid blog ID" });
    }
    
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;