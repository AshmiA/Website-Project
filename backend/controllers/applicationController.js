
import Application from "../models/Application.js";
export const createApplication = async (req, res) => {
  try {
    const {
      jobId,
      jobTitle,
      designation,
      yourName,
      mobileNumber,
      yourEmail,
      experienceYears,
      skills,
      salaryExpectation,
      description,
    } = req.body;

    const application = new Application({
      jobId,
      jobTitle,
      designation,
      yourName,
      mobileNumber,
      yourEmail,
      experienceYears,
      skills,
      salaryExpectation,
      description,

      resume: req.file
        ? {
            data: req.file.buffer,
            contentType: req.file.mimetype,
            filename: req.file.originalname,
          }
        : null,
    });

    await application.save();
    res.status(201).json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Submission failed" });
  }
};

// GET – admin list
export const getApplications = async (req, res) => {
  const apps = await Application.find().sort({ createdAt: -1 });
  res.json(apps);
};

// PUT – update status
export const updateStatus = async (req, res) => {
  await Application.findByIdAndUpdate(req.params.id, {
    status: req.body.status,
  });
  res.json({ ok: true });
};

// GET – resume
export const getResume = async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app?.pdfFile) return res.sendStatus(404);

  res.set("Content-Type", app.pdfFile.contentType);
  res.send(app.pdfFile.data);
};
