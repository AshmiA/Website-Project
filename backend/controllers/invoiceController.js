import Invoice from "../models/Invoice.js";

export const getInvoices = async (req, res) => {
  const data = await Invoice.find().sort({ createdAt: -1 });
  res.json(data);
};

export const createInvoice = async (req, res) => {
  try {
    const doc = await Invoice.create(req.body);
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const doc = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
