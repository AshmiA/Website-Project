import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaEye } from "react-icons/fa";

const API_BASE = "http://localhost:5000";
const ACTIVE_COLOR = "#1b6e39";

export function JobFormPage({ job, onSave, onCancel }) {
  const isEditing = !!job;
  const [formData, setFormData] = useState({
    jobTitle: "",
    designation: "",
    leftExp: "",
    rightExp: "",
    jobType: "",
    location: "",
    jobSummary: "",
    preferredSkills: "",
    requiredQualifications: "",
    responsibilities: "",
    status: "Active",
  });

  function autoResize(e) {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  }

  useEffect(() => {
    const areas = document.querySelectorAll(".auto-textarea");
    areas.forEach((ta) => {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    });
  }, [formData]);

  useEffect(() => {
    if (job) {
      let left = "00";
      let right = "00";

      if (job.experience) {
        if (job.experience === "Fresher") {
          left = "00";
          right = "00";
        } else if (/^\d+ years?$/.test(job.experience)) {
          const L = job.experience.match(/(\d+)/)[0];
          left = L.padStart(2, "0");
          right = "00";
        } else {
          const match = job.experience.match(/(\d+)\s*[-–]\s*(\d+)/);
          if (match) {
            left = match[1].padStart(2, "0");
            right = match[2].padStart(2, "0");
          }
        }
      }

      setFormData({
        jobTitle: job.jobTitle || "",
        designation: job.designation || "",
        leftExp: left,
        rightExp: right,
        jobType: job.jobType || "",
        location: job.location || "",
        jobSummary: job.jobSummary || "",
        preferredSkills: Array.isArray(job.preferredSkills)
          ? job.preferredSkills.join("\n")
          : job.preferredSkills || "",
        requiredQualifications: Array.isArray(job.requiredQualifications)
          ? job.requiredQualifications.join("\n")
          : job.requiredQualifications || "",
        responsibilities: job.responsibilities || "",
        status: job.status || "Active",
      });
    }
  }, [job]);

  const handleInput = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const buildExperience = () => {
    const L = Number(formData.leftExp);
    const R = Number(formData.rightExp);

    if (L === 0 && R === 0) return "Fresher";
    if (R === 0 || R < L) return `${L} years`;
    return `${L} - ${R} years`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave(
      {
        jobTitle: formData.jobTitle,
        designation: formData.designation,
        experience: buildExperience(),
        jobType: formData.jobType,
        location: formData.location,
        jobSummary: formData.jobSummary,
        preferredSkills: formData.preferredSkills
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
        requiredQualifications: formData.requiredQualifications
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
        responsibilities: formData.responsibilities,
        status: formData.status,
        postedOn: job?.postedOn || new Date().toLocaleDateString("en-GB"),
      },
      isEditing
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#345261]">
              {isEditing ? "Edit Job" : "Add New Job"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* BASIC INFO - NO EXTRA GAP */}
            <div className="pb-2">
              <h3 className="text-lg font-semibold text-[#345261] mb-4">
                Basic Information
              </h3>

              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-6 mb-2">
                <div>
                  <label className="block text-sm font-medium text-[#345261] mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleInput("jobTitle", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#345261]"
                    placeholder="Enter job title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#345261] mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => handleInput("designation", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#345261]"
                    placeholder="Enter designation"
                    required
                  />
                </div>
              </div>

              {/* Row 2 */}
<div className="grid grid-cols-2 gap-6 mb-2">
  <div>
    <label className="block text-sm font-medium text-[#345261] mb-1">
      Experience *
    </label>

    {/* ✅ CENTERED INPUT GROUP */}
    <div className="flex items-center justify-center gap-3">
      <input
        type="text"
        value={formData.leftExp}
        onChange={(e) =>
          handleInput("leftExp", e.target.value.replace(/\D/g, ""))
        }
        maxLength={2}
        className="w-24 border border-gray-300 rounded-lg px-4 py-3 text-center focus:ring-2 focus:ring-[#345261]"
        placeholder="0"
      />

      <span className="text-lg font-semibold text-gray-500">-</span>

      <input
        type="text"
        value={formData.rightExp}
        onChange={(e) =>
          handleInput("rightExp", e.target.value.replace(/\D/g, ""))
        }
        maxLength={2}
        className="w-24 border border-gray-300 rounded-lg px-4 py-3 text-center focus:ring-2 focus:ring-[#345261]"
        placeholder="0"
      />

      <span className="text-sm text-gray-600">years</span>
    </div>
  </div>

  <div>
    

    {/* Optional: center Job Type also */}
    <div>
                  <label className="block text-sm font-medium text-[#345261] mb-1">
                    Job Type *
                  </label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => handleInput("jobType", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#345261]"
                    required
                  >
                    <option value="text-[#345261]">Select Job Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Freelancing</option>
                  </select>
                </div>
  </div>
</div>


              {/* Location – removed bottom space */}
              <div className="mb-0">
                <label className="block text-sm font-medium text-[#345261] mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInput("location", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#345261]"
                  placeholder="Enter location"
                  required
                />
              </div>
            </div>

            {/* JOB DETAILS */}
            <div className="pb-6">
              <h3 className="text-lg font-semibold text-[#345261] mb-4">
                Job Details
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#345261] mb-1">
                    Job Summary
                  </label>
                  <textarea
                    value={formData.jobSummary}
                    onChange={(e) => handleInput("jobSummary", e.target.value)}
                    onInput={autoResize}
                   
                    className="auto-textarea no-scrollbar w-full border border-gray-300 rounded-lg px-4 py-3 resize-none overflow-hidden focus:ring-2 focus:ring-[#345261]"

                    placeholder="Enter job summary"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#345261] mb-1">
                    Preferred Skills 
                  </label>
                  <textarea
                    value={formData.preferredSkills}
                    onChange={(e) =>
                      handleInput("preferredSkills", e.target.value)
                    }
                    onInput={autoResize}
                    className="auto-textarea no-scrollbar w-full border border-gray-300 rounded-lg px-4 py-3 resize-none overflow-hidden focus:ring-2 focus:ring-[#345261]"

                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#345261] mb-1">
                    Required Qualifications 
                  </label>
                  <textarea
                    value={formData.requiredQualifications}
                    onChange={(e) =>
                      handleInput("requiredQualifications", e.target.value)
                    }
                    onInput={autoResize}
                    className="auto-textarea no-scrollbar w-full border border-gray-300 rounded-lg px-4 py-3 resize-none overflow-hidden focus:ring-2 focus:ring-[#345261]"

                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#345261] mb-1">
                    Responsibilities
                  </label>
                  <textarea
                    value={formData.responsibilities}
                    onChange={(e) =>
                      handleInput("responsibilities", e.target.value)
                    }
                    onInput={autoResize}
                    className="auto-textarea no-scrollbar w-full border border-gray-300 rounded-lg px-4 py-3 resize-none overflow-hidden focus:ring-2 focus:ring-[#345261]"

                    placeholder="Enter responsibilities"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* STATUS */}

<div className="pb-6">
  <div className="flex items-center gap-10">
    <span className="text-sm font-medium text-[#345261] w-16">Status</span>
    
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="status"
        value="Active"
        checked={formData.status === "Active"}
        onChange={(e) => handleInput("status", e.target.value)}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          formData.status === "Active"
            ? "border-green-600"
            : "border-green-400"
        }`}
      >
        {formData.status === "Active" && (
          <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
        )}
      </div>
      <span className="text-green-600 font-medium">Active</span>
    </label>

    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="status"
        value="Inactive"
        checked={formData.status === "Inactive"}
        onChange={(e) => handleInput("status", e.target.value)}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          formData.status === "Inactive"
            ? "border-red-500"
            : "border-red-300"
        }`}
      >
        {formData.status === "Inactive" && (
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
        )}
      </div>
      <span className="text-red-500 font-medium">In Active</span>
    </label>

    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="status"
        value="On Hold"
        checked={formData.status === "On Hold"}
        onChange={(e) => handleInput("status", e.target.value)}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          formData.status === "On Hold"
            ? "border-orange-500"
            : "border-orange-300"
        }`}
      >
        {formData.status === "On Hold" && (
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
        )}
      </div>
      <span className="text-orange-500 font-medium">On Hold</span>
    </label>
  </div>
</div>


            {/* BUTTONS */}
            <div className="flex justify-end items-center pt-6  gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg"
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-8 py-3 text-white rounded-lg font-medium hover:bg-[#2a424a]"
                style={{ backgroundColor: "#345261" }}
              >
                {isEditing ? "Upload" : "Upload"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function PreviewPage({ job, onEdit, onClose }) {
  const toList = (v) =>
    !v
      ? []
      : Array.isArray(v)
      ? v
      : v.split("\n").map((x) => x.trim()).filter(Boolean);
  const preferred = toList(job.preferredSkills);
  const qual = toList(job.requiredQualifications);
  const resp = toList(job.responsibilities);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#345261]">Job Preview</h2>
             
            </div>

            {/* EDIT BUTTON — clean outline style like screenshot */}
            <button
              onClick={onEdit}
              className="px-5 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
              style={{
                color: "#345261",
                background: "#fff"
              }}
            >
              <FaEdit size={16} /> Edit
            </button>
          </div>

          {/* Job Details */}
          <div className="space-y-8">

            {/* Basic Information */}
            <div className=" pb-6">
              <h3 className="text-lg font-semibold text-[#345261] mb-4">
                Basic Information
              </h3>

              {/* 3 Column Clean Layout */}
              <div className="space-y-6">

                {/* Job Title */}
                <div className="grid grid-cols-[140px_1fr]">
                  <p className="text-sm text-gray-600">Job Title</p>
                  <p className="font-medium text-gray-600">
                    {job.jobTitle || "-"}
                  </p>
                </div>

                {/* Designation */}
                <div className="grid grid-cols-[140px_1fr]">
                  <p className="text-sm text-gray-600">Designation</p>
                  <p className="font-medium text-gray-600">
                    {job.designation || "-"}
                  </p>
                </div>

                {/* Experience */}
                <div className="grid grid-cols-[140px_1fr]">
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-medium text-gray-600">
                    {(() => {
                      const match = job.experience?.match(/(\d+)/g) || [];
                      const L = Number(match[0] || 0);
                      const R = Number(match[1] || 0);

                      if (L === 0 && R === 0) return "Fresher";
                      if (R === 0 || R < L) return `${L} yrs`;
                      return `${L}-${R} yrs`;
                    })()}
                  </p>
                </div>

              </div>
            </div>

            {/* Job Summary */}
            {job.jobSummary && (
              <div className=" pb-6">
                <h3 className="text-lg font-semibold text-[#345261] mb-4">
                  Job Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {job.jobSummary}
                </p>
              </div>
            )}

            {/* Preferred Skills */}
            {preferred.length > 0 && (
              <div className=" pb-6">
                <h3 className="text-lg font-semibold text-[#345261] mb-4">
                  Preferred Skills
                </h3>
                <ul className="space-y-2">
                  {preferred.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gray-500 mt-1">•</span>
                      <span className="text-gray-700">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Qualifications */}
            {qual.length > 0 && (
              <div className=" pb-6">
                <h3 className="text-lg font-semibold text-[#345261] mb-4">
                  Required Qualifications
                </h3>
                <ul className="space-y-2">
                  {qual.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gray-500 mt-1">•</span>
                      <span className="text-gray-700">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {resp.length > 0 && (
              <div className=" pb-6">
                <h3 className="text-lg font-semibold text-[#345261] mb-4">
                  Responsibilities and Duties
                </h3>
                <ul className="space-y-2">
                  {resp.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gray-500 mt-1">•</span>
                      <span className="text-gray-700">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex justify-end mt-8">
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: "#345261",
                color: "white"
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main JobPost Component
export default function JobPost() {
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(10);

  const [previewJob, setPreviewJob] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list', 'form', 'preview'

  useEffect(() => {
    // Load jobs
    fetch(`${API_BASE}/api/jobs`)
      .then((r) => r.json())
      .then((d) => setJobs(d))
      .catch(() => setJobs([]));
  }, []);

  const pushToast = (msg, ttl = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message: msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredJobs(null);
      setCurrentPage(1);
      return;
    }
    const filtered = jobs.filter((job) => {
      const slNo = String(jobs.indexOf(job) + 1).padStart(2, "0");
      const jt = (job.jobTitle || "").toLowerCase();
      const des = (job.designation || "").toLowerCase();
      const t = term.toLowerCase();
      return slNo.includes(t) || jt.includes(t) || des.includes(t);
    });
    setFilteredJobs(filtered);
    setCurrentPage(1);
  };

  const displayJobs = filteredJobs || jobs;
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = displayJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.max(1, Math.ceil(displayJobs.length / jobsPerPage));

  const serial = (n) => String(n).padStart(2, "0");

  const handleAddNew = () => {
    setEditingJob(null);
    setViewMode("form");
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setViewMode("form");
  };

  const handleDelete = async (job) => {
    try {
      await fetch(`${API_BASE}/api/jobs/${job._id}`, { method: "DELETE" });
      setJobs((p) => p.filter((j) => j._id !== job._id));
      pushToast("Job deleted successfully");
    } catch (e) {
      console.error(e);
      pushToast("Error deleting job");
    }
  };

  const handlePreview = (job) => {
    setPreviewJob(job);
    setViewMode("preview");
  };

  const handleSaveJob = async (jobData, isEditing) => {
    try {
      if (isEditing && editingJob) {
        const res = await fetch(`${API_BASE}/api/jobs/${editingJob._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });
        const updated = await res.json();
        setJobs((prev) => prev.map((j) => (j._id === updated._id ? updated : j)));
        pushToast("Job updated successfully");
      } else {
        const res = await fetch(`${API_BASE}/api/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });
        const newJob = await res.json();
        setJobs((prev) => [newJob, ...prev]);
        pushToast("Job created successfully");
      }
      setViewMode("list");
      setEditingJob(null);
    } catch (err) {
      console.error(err);
      pushToast("Error saving job");
    }
  };

  const handleCancel = () => {
    setViewMode("list");
    setEditingJob(null);
  };

  const handleClosePreview = () => {
    setViewMode("list");
    setPreviewJob(null);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Active":
        return { color: ACTIVE_COLOR };
      case "Inactive":
        return { color: "#dc2626" };
      case "On Hold":
        return { color: "#ca8a04" };
      default:
        return { color: "#374151" };
    }
  };

  // Render based on view mode
  if (viewMode === "form") {
    return (
      <JobFormPage
        job={editingJob}
        onSave={handleSaveJob}
        onCancel={handleCancel}
      />
    );
  }

  if (viewMode === "preview" && previewJob) {
    return (
      <PreviewPage
        job={previewJob}
        onEdit={() => {
          setViewMode("form");
          setEditingJob(previewJob);
        }}
        onClose={handleClosePreview}
      />
    );
  }

  // Main list view
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <style>{`@keyframes toast-progress { from { transform: scaleX(1);} to { transform: scaleX(0);} }`}</style>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 w-[340px]">
        {toasts.map((t) => (
          <div key={t.id} className="mb-3">
            <div
              className="bg-white border rounded-lg shadow-lg overflow-hidden"
              style={{ borderColor: "#dfe8ee" }}
            >
              <div className="px-4 py-3 text-sm">{t.message}</div>
              <div className="h-1 bg-white">
                <div
                  className="h-1"
                  style={{
                    backgroundColor: "#345261",
                    transformOrigin: "left",
                    animation: `toast-progress 3000ms linear forwards`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Job Postings</h1>
           
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search jobs..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#345261] focus:border-transparent bg-white w-64"
              />
            </div>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium hover:bg-[#2a424a] transition-colors"
              style={{ backgroundColor: "#345261" }}
            >
              <FaPlus /> New Job
            </button>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr
                  className="text-white text-sm"
                  style={{ backgroundColor: "#345261" }}
                >
                  <th className="py-4 px-6 text-center font-medium">Sl No</th>
                  <th className="py-4 px-6 text-center font-medium">Job Title</th>
                  <th className="py-4 px-6 text-center font-medium">
                    Designation
                  </th>
                  <th className="py-4 px-6 text-center font-medium">
                    Experience
                  </th>
                  <th className="py-4 px-6 text-center font-medium">Job Type</th>
                  <th className="py-4 px-6 text-center font-medium">Location</th>
                  <th className="py-4 px-6 text-center font-medium">
                    Posted on
                  </th>
                  <th className="py-4 px-6 text-center font-medium">Status</th>
                  <th className="py-4 px-6 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentJobs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-gray-500 bg-white"
                    >
                      {filteredJobs
                        ? "No jobs found matching your search."
                        : "No jobs posted yet. Click 'New Job' to create your first job posting."}
                    </td>
                  </tr>
                ) : (
                  currentJobs.map((job, index) => (
                    <tr
                      key={job._id || job.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-center font-medium text-gray-700">
                        {serial(indexOfFirstJob + index + 1)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {job.jobTitle || "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-semibold" style={{ color: "#345261" }}>
                          {job.designation || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {job.experience || "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {job.jobType || "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {job.location || "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {job.postedOn}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className="inline-flex px-3 py-1 text-xs font-semibold rounded-full"
                          style={getStatusStyle(job.status)}
                        >
                          {job.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handlePreview(job)}
                            className="p-2 rounded hover:bg-gray-100 transition-colors"
                            style={{ color: "#345261" }}
                            title="Preview"
                          >
                            <FaEye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(job)}
                            className="p-2 rounded hover:bg-gray-100 transition-colors"
                            style={{ color: "#345261" }}
                            title="Edit"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(job)}
                            className="p-2 rounded hover:bg-gray-100 transition-colors"
                            style={{ color: "#345261" }}
                            title="Delete"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination*/}
{displayJobs.length > 10 && (
  <div className="flex justify-center items-center space-x-2 mt-8">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full max-w-7xl">
      <div className="flex justify-center items-center gap-3">

        {/* PREV */}
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center border border-gray-300 
                     bg-white text-gray-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed 
                     hover:bg-gray-100 transition-colors"
        >
          &lt;
        </button>

        {/* CURRENT PAGE */}
        <div className="w-10 h-10 flex items-center justify-center rounded-full 
                        bg-[#345261] text-white text-sm font-medium">
          {currentPage}
        </div>

        {/* NEXT */}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center border border-gray-300 
                     bg-white text-gray-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed 
                     hover:bg-gray-100 transition-colors" >
          &gt;
        </button>
         </div>
    </div>
  </div>
)}
     </div>
    </div>
  );
}