
import express from "express";
import multer from "multer";
import {
  createApplication,
  getApplications,
  updateStatus,
  getResume,
} from "../controllers/applicationController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("resume"), createApplication);
router.get("/", getApplications);
router.put("/:id", updateStatus);
router.get("/resume/:id", getResume);

export default router;
