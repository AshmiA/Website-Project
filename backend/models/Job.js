import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    jobTitle: String,
    designation: String,
    category: String,
    experienceYears: String,
    experienceMonths: String,
    experience: String,
    jobType: String,
    location: String,
    jobSummary: String,
    preferredSkills: [String],
    requiredQualifications: [String],
    responsibilities: String,
    postedOn: String,
    status: { type: String, default: "Active" }
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);