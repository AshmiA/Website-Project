import express from "express";
import {
  getJobs,
  getPublicJobs,
  createJob,
  updateJob,
  deleteJob
} from "../controllers/jobController.js";

const router = express.Router();

// public careers page
router.get("/public", getPublicJobs);

// admin
router.get("/", getJobs);
router.post("/", createJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

export default router;
