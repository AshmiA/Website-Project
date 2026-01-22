import Quotation from "../models/Quotation.js";

export const getQuotations = async (req, res) => {
  const data = await Quotation.find().sort({ createdAt: -1 });
  res.json(data);
};

export const createQuotation = async (req, res) => {
  try {
    const doc = await Quotation.create(req.body);
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateQuotation = async (req, res) => {
  try {
    const doc = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteQuotation = async (req, res) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
