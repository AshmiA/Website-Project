import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  yourName: String,
  yourEmail: String,
  mobileNumber: String,
  jobTitle: String,
  designation: String,
  experienceYears: String,
  skills: String,
  salaryExpectation: String,
  description: String,

  status: {
    type: String,
    default: "view",
  },

  // ✅ REQUIRED FIELD
  appliedDate: {
    type: Date,
    default: Date.now, // ⚠️ DO NOT use Date.now()
  },

  pdfFile: {
    data: Buffer,
    contentType: String,
  },
});

export default mongoose.model("Application", applicationSchema);
