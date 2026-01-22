import mongoose from "mongoose";

/* ------------------ ACCESS SCHEMA ------------------ */
const AccessSchema = new mongoose.Schema(
  {
    job: { type: Boolean, default: false },
    blogs: { type: Boolean, default: false },
    gallery: { type: Boolean, default: false },
    applicants: { type: Boolean, default: false },
    invoice: { type: Boolean, default: false },
    quotation: { type: Boolean, default: false },
  },
  { _id: false }
);

/* ------------------ USER SCHEMA ------------------ */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // Optional email (used internally for admin OTP)
    email: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    access: {
      type: AccessSchema,
      default: () => ({}),
    },

    /* -------- FORGOT PASSWORD / OTP -------- */
    resetOtp: {
      type: String,
    },

    resetOtpExpires: {
      type: Date,
    },

    isOtpVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);
