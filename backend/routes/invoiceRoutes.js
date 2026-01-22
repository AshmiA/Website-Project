import express from "express";
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/", getInvoices);
router.post("/", createInvoice);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);

export default router;
