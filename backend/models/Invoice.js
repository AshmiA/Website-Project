import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  amount: Number,
  gstPercent: Number,
});

const invoiceSchema = new mongoose.Schema(
  {
    type: { type: String, default: "invoice" },
    number: String,
    date: String,

    from: {
      name: String,
      email: String,
      phone: String,
      address: String,
    },

    to: {
      name: String,
      email: String,
      phone: String,
      address: String,
    },

    items: [itemSchema],

    discountPercent: String,
    roundOff: Boolean,
    showDiscount: Boolean,

    // ADD THESE FIELDS WITH PROPER DEFAULTS
    showAdditionalInfo: { type: Boolean, default: false },
    additionalInfo: { type: String, default: "" },

    logo: {
      name: String,
      dataUrl: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);