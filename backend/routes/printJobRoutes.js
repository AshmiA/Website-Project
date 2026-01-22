import express from "express";
import { printDocument } from "../controllers/printJobController.js";

const router = express.Router();

router.post("/", printDocument);

export default router;