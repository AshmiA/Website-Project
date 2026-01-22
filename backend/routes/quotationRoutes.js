import express from "express";
import {
  getQuotations,
  createQuotation,
  updateQuotation,
  deleteQuotation
} from "../controllers/quotationController.js";

const router = express.Router();

router.get("/", getQuotations);
router.post("/", createQuotation);
router.put("/:id", updateQuotation);
router.delete("/:id", deleteQuotation);

export default router;
