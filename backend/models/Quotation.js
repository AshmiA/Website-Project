import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  amount: Number,
  gstPercent: Number,
});

const quotationSchema = new mongoose.Schema(
  {
    type: { type: String, default: "quotation" },
    number: String,
    date: String,

    logo: {
      name: String,
      dataUrl: String,
    },

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

    // ADD THIS FIELD
    showAdditionalInfo: { type: Boolean, default: false },
    additionalInfo: String,
  },
  { timestamps: true }
);

export default mongoose.model("Quotation", quotationSchema);