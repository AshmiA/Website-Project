import Job from "../models/Job.js";

/* Admin – all jobs */
export const getJobs = async (req, res) => {
  const jobs = await Job.find().sort({ createdAt: -1 });
  res.json(jobs);
};

/* 🌍 Public – ONLY active jobs */
export const getPublicJobs = async (req, res) => {
  const jobs = await Job.find({ status: "Active" }).sort({
    createdAt: -1,
  });
  res.json(jobs);
};

export const createJob = async (req, res) => {
  const job = await Job.create(req.body);
  res.status(201).json(job);
};

export const updateJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(job);
};

export const deleteJob = async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
