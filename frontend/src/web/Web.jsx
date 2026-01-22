import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaRegClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

/* --------------------------------------------------
   JOB MODAL
-------------------------------------------------- */
export function JobModal({ job, onClose, showToast }) {
  const [showApply, setShowApply] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    yourName: "",
    yourEmail: "",
    mobileNumber: "",
    skills: "",
    experienceYears: "",
    salaryExpectation: "",
    description: "",
    resume: null,
  });

  const toList = (v) =>
    !v
      ? []
      : Array.isArray(v)
      ? v
      : v
          .toString()
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);

  const preferred = toList(job?.preferredSkills || "");
  const required = toList(job?.requiredQualifications || "");
  const responsibilities = toList(job?.responsibilities || "");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobileNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, [name]: digits });
    } else if (name === "yourEmail") {
      setForm({ ...form, [name]: value.toLowerCase() });
    } else {
      setForm({ ...form, [name]: value });
    }

    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleResume = (e) => {
    const f = e.target.files[0];
    if (!f) {
      setForm((p) => ({ ...p, resume: null }));
      return;
    }
    
    if (
      ![
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ].includes(f.type)
    ) {
      setErrors((prev) => ({
        ...prev,
        resume: "Only PDF, JPG, JPEG, PNG, GIF allowed",
      }));
      e.target.value = "";
      return;
    }
    setErrors((prev) => ({ ...prev, resume: "" }));
    setForm((p) => ({ ...p, resume: f }));
  };

  const validateEmail = (email) => /^[a-z0-9._%+-]+@gmail\.com$/.test(email);
  const validateMobile = (num) => /^\d{10}$/.test(num);

  const submit = async (e) => {
    e.preventDefault();

    let err = {};
    if (!form.yourName.trim()) err.yourName = "Name is required";
    if (!form.yourEmail.trim()) err.yourEmail = "Email is required";
    else if (!validateEmail(form.yourEmail))
      err.yourEmail = "Email must end with @gmail.com";

    if (!form.mobileNumber.trim()) err.mobileNumber = "Mobile is required";
    else if (!validateMobile(form.mobileNumber))
      err.mobileNumber = "Mobile must be 10 digits";

    if (!form.skills.trim()) err.skills = "Skills required";
    if (!form.experienceYears.trim()) err.experienceYears = "Experience required";
    if (!form.salaryExpectation.trim()) err.salaryExpectation = "Salary required";
    if (!form.description.trim()) err.description = "Description required";
    if (!form.resume) err.resume = "Resume required";

    if (Object.keys(err).length > 0) {
      setErrors(err);
      toast.error("Please fix errors");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("yourName", form.yourName);
      fd.append("yourEmail", form.yourEmail);
      fd.append("mobileNumber", form.mobileNumber);
      fd.append("skills", form.skills);
      fd.append("experienceYears", form.experienceYears);
      fd.append("salaryExpectation", form.salaryExpectation);
      fd.append("description", form.description);
      fd.append("jobId", job._id);
      fd.append("jobTitle", job.jobTitle);
      fd.append("designation", job.designation);
      fd.append("appliedDate", new Date().toISOString());
      fd.append("resume", form.resume);

      const res = await fetch(`${API_BASE}/api/applications`, {
        method: "POST",
        body: fd,
      });

      const responseText = await res.text();
      
      if (!res.ok) {
        throw new Error(responseText || "Failed to submit application");
      }

      toast.success("Application submitted!");
      setShowApply(false);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to submit application");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigate = useNavigate();

  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.55)] flex items-center justify-center p-3 z-50">
      {/* ------------ MAIN MODAL ------------ */}
      <div className="bg-white w-[1200px] max-w-[95vw] max-h-[90vh] rounded-2xl shadow-xl border flex relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-2xl text-gray-700 hover:text-black z-10"
        >
          ✕
        </button>

        {/* LEFT CONTENT */}
        <div className="flex-1 p-10 overflow-y-auto relative border-r-2" style={{ borderColor: "#345261" }}>
          <h1 className="text-4xl font-bold text-[#345261] mb-6">
            {job.jobTitle}
          </h1>

          <h2 className="text-lg font-semibold text-[#345261] mb-3">
            Job Summary
          </h2>

          <p className="text-[#345261] mb-8 text-[16px] leading-relaxed">
            {job.jobSummary}
          </p>

<div className="mb-8">
  <div
    className="
      w-full
      bg-[#325160]
      text-white
      rounded-xl
      py-3
      px-10
      flex
      justify-between
      items-center
    "
  >
    {/* Experience */}
    <div className="flex flex-col items-center flex-1 leading-tight">
      <span className="text-[24px] font-medium opacity-90">
        Experience
      </span>
      <span className="text-[18px] font-medium mt-[3px] pt-1">
        {job.experience}
      </span>
    </div>

    {/* Designation */}
    <div className="flex flex-col items-center flex-1 leading-tight">
      <span className="text-[24px] font-medium opacity-90">
        Designation
      </span>
      <span className="text-[18px] font-medium mt-[3px] pt-1">
        {job.designation}
      </span>
    </div>
  </div>
</div>

        {/* Preferred Skills */}
{preferred.length > 0 && (
  <>
    <h3 className="text-lg font-semibold text-[#345261] mb-3">
      Preferred Skills
    </h3>

    <ul className="list-disc pl-6 text-[#345261] text-[16px] space-y-2 mb-8 marker:text-[#345261] marker:text-lg">
      {preferred.map((p, i) => (
        <li key={i}>{p.replace(/^•/, "")}</li>
      ))}
    </ul>
  </>
)}

{/* Required Qualification */}
{required.length > 0 && (
  <>
    <h3 className="text-lg font-semibold text-[#345261] mb-3">
      Required Qualification
    </h3>

    <ul className="list-disc pl-6 text-[#345261] text-[16px] space-y-2 mb-8 marker:text-[#345261] marker:text-lg">
      {required.map((q, i) => (
        <li key={i}>{q.replace(/^•/, "")}</li>
      ))}
    </ul>
  </>
)}

{/* Responsibilities */}
{responsibilities.length > 0 && (
  <>
    <h3 className="text-lg font-semibold text-[#345261] mb-3">
      Responsibilities and Duties
    </h3>

    <ul className="list-disc pl-6 text-[#345261] text-[16px] space-y-2 marker:text-[#345261] marker:text-lg">
      {responsibilities.map((r, i) => (
        <li key={i}>{r.replace(/^•/, "")}</li>
      ))}
    </ul>
  </>
)}
</div>

        {/* RIGHT SIDEBAR */}
        <div className="w-80 p-5 border-l border-gray-200">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <i className="bi bi-calendar3 text-[18px] text-[#325160] font-bold"></i>
              <span className="text-[16px] text-[#325160] font-semibold">
                {job.jobType}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <i className="bi bi-clock text-[18px] text-[#325160] font-bold"></i>
              <span className="text-[16px] text-[#325160] font-semibold">
                9.00 AM to 5.30 PM
              </span>
            </div>

            <div className="flex items-center gap-3">
              <i className="bi bi-geo-alt text-[18px] text-[#325160] font-bold"></i>
              <span className="text-[16px] text-[#325160] font-semibold">
                {job.location}
              </span>
            </div>

            {job.status === "Active" ? (
  <button
  onClick={() => setShowApply(true)}
  className="
    w-[130px]
    h-[40px]
    bg-[#345261]
    text-white
    font-bold
    text-[12px]
    uppercase
    rounded-[12px]
    flex items-center justify-center
    border border-[#345261]
    transition-all duration-300
    hover:bg-white
    hover:text-[#345261]
    p-0
  "
>
  APPLY NOW
</button>

) : (
  <button
    className="
      w-[164.21px] 
      h-[53.6px]
      bg-gray-200 
      text-gray-500 
      rounded-[10px] 
      font-montserrat
      font-bold 
      text-[12px] 
      leading-[18px]
      uppercase
      text-center
      flex items-center justify-center
      border border-gray-300
      mt-6
      cursor-not-allowed
    "
    disabled
  >
    NOT AVAILABLE
  </button>
)}

          </div>
        </div>
      </div>

      {/* ------------ APPLY FORM MODAL ------------ */}
      {showApply && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.65)] flex items-center justify-center p-6 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl border w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowApply(false)}
              className="absolute top-4 right-4 text-2xl font-bold text-black z-10"
            >
              ×
            </button>

            <div className="p-10">
              <h2 className="text-2xl font-bold text-[#345261] text-center mb-10">
                Apply for {job.jobTitle}
              </h2>

              <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <input 
                    value={job.jobTitle} 
                    readOnly 
                    className="input border border-gray-300 rounded-lg px-4 py-2 bg-gray-50" 
                  />
                  <input 
                    value={job.designation} 
                    readOnly 
                    className="input border border-gray-300 rounded-lg px-4 py-2 bg-gray-50" 
                  />

                  <div>
                    <input
                      name="yourName"
                      value={form.yourName}
                      onChange={handleChange}
                      className="input border border-gray-300 rounded-lg px-4 py-2 w-full"
                      placeholder="Your Name"
                    />
                    {errors.yourName && (
                      <p className="text-red-500 text-sm mt-1">{errors.yourName}</p>
                    )}
                  </div>

                  <div>
                    <input
                      name="mobileNumber"
                      value={form.mobileNumber}
                      onChange={handleChange}
                      className="input border border-gray-300 rounded-lg px-4 py-2 w-full"
                      placeholder="Mobile Number"
                    />
                    {errors.mobileNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.mobileNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      name="yourEmail"
                      value={form.yourEmail}
                      onChange={handleChange}
                      className="input border border-gray-300 rounded-lg px-4 py-2 w-full"
                      placeholder="Email"
                      type="email"
                    />
                    {errors.yourEmail && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.yourEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      name="experienceYears"
                      value={form.experienceYears}
                      onChange={handleChange}
                      className="input border border-gray-300 rounded-lg px-4 py-2 w-full"
                      placeholder="Experience (years)"
                    />
                    {errors.experienceYears && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.experienceYears}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      name="skills"
                      value={form.skills}
                      onChange={handleChange}
                      className="input border border-gray-300 rounded-lg px-4 py-2 w-full"
                      placeholder="Skills"
                    />
                    {errors.skills && (
                      <p className="text-red-500 text-sm mt-1">{errors.skills}</p>
                    )}
                  </div>

                  <div>
                    <input
                      name="salaryExpectation"
                      value={form.salaryExpectation}
                      onChange={handleChange}
                      className="input border border-gray-300 rounded-lg px-4 py-2 w-full"
                      placeholder="Salary Expectation"
                    />
                    {errors.salaryExpectation && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.salaryExpectation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={(e) => {
                      setForm({ ...form, description: e.target.value });
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    placeholder="Short profile description..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none text-[14px] overflow-hidden min-h-[100px]"
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Resume Upload */}
                <div>
                  <div className="upload-box border border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      id="resume-upload"
                      type="file"
                      className="hidden"
                      accept="application/pdf,image/*"
                      onChange={handleResume}
                    />
                    <label
                      htmlFor="resume-upload"
                      className="cursor-pointer flex items-center justify-center text-gray-600"
                    >
                      Click to upload your Resume
                    </label>
                  </div>

                  {form.resume && (
                    <p className="text-[#345261] font-semibold mt-2">
                      Uploaded File:{" "}
                      <span className="font-normal">
                        {form.resume.name}
                      </span>
                    </p>
                  )}

                  {errors.resume && (
                    <p className="text-red-500 text-sm mt-1">{errors.resume}</p>
                  )}
                </div>

               <div className="flex justify-start">
  <button
    type="submit"
    disabled={isSubmitting}
    className="bg-[#325160] text-white px-4 py-2 text-sm rounded-md font-medium
               hover:bg-[#2a4552] transition-colors
               disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isSubmitting ? "SUBMITTING..." : "SEND APPLICATION"}
  </button>
</div>

              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GalleryImage({ item }) {
  const [isLandscape, setIsLandscape] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imgSrc, setImgSrc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (item.type === "image") {
      setLoading(true);
      const img = new Image();
      img.src = `${API_BASE}${item.url}`;
      img.onload = () => {
        setImgSrc(img.src);
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        setIsLandscape(width >= height);
        setDimensions({ width, height });
        setLoading(false);
      };
      img.onerror = () => {
        console.error("Failed to load image:", item.url);
        setLoading(false);
      };
    } else {
      setLoading(false);
    }
  }, [item.url, item.type]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    toast.info("Image downloading is disabled");
    return false;
  };

  const handleDragStart = (e) => {
    e.preventDefault();
    return false;
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      e.preventDefault();
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-300 shadow bg-gray-100 flex items-center justify-center"
        style={{ height: "240px" }}>
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-xl overflow-hidden border border-gray-300 shadow bg-white flex items-center justify-center relative group"
      style={{
        height: "240px",
        width: isLandscape ? "100%" : "auto",
        maxWidth: isLandscape ? "100%" : "160px",
        margin: "0 auto",
      }}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
    >
      <div 
        className="absolute inset-0 z-10 cursor-default"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onMouseDown={handleMouseDown}
        style={{ 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      />
      
      {item.type === "image" ? (
        <img
          src={imgSrc}
          className={`${isLandscape ? 'w-full h-full object-cover' : 'h-full w-auto'} select-none`}
          alt="Gallery"
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
          draggable="false"
          loading="lazy"
        />
      ) : (
        <video
          src={`${API_BASE}${item.url}`}
          className="w-full h-full object-contain bg-black select-none"
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onLoadedMetadata={(e) => {
            const width = e.target.videoWidth;
            const height = e.target.videoHeight;
            setIsLandscape(width >= height);
            setDimensions({ width, height });
          }}
          onContextMenu={handleContextMenu}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        />
      )}
      
      <div 
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center bg-black/20 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
        }}
      >
        <div className="text-white/80 text-sm font-semibold bg-black/30 px-3 py-1 rounded">
          Spangles Webx
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80">
      <span className="text-sm text-gray-800">{message}</span>

      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
        <div className="bg-[#345261] h-1 rounded-full toast-progress"></div>
      </div>
    </div>
  );
}

/* --------------------------------------------------
   MAIN WEB PAGE
-------------------------------------------------- */

export default function Web() {
  const navigate = useNavigate();

  const [toastMsg, setToastMsg] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [previewJob, setPreviewJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [galleries, setGalleries] = useState([]);
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/blogs`);
        if (res.ok) {
          const data = await res.json();
          setBlogs(data);
        }
      } catch (error) {
        console.error("Error loading blogs:", error);
        setBlogs([]);
      }
    };

    loadBlogs();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [jobsRes, galleriesRes] = await Promise.all([
          fetch(`${API_BASE}/api/jobs`).catch(() => ({ ok: false })),
          fetch(`${API_BASE}/api/gallery`, { 
            cache: "no-cache",
            headers: {
              'Cache-Control': 'no-cache'
            }
          }).catch(() => ({ ok: false })),
        ]);

        const jobsData = jobsRes.ok ? await jobsRes.json() : [];
        const galleriesData = galleriesRes.ok ? await galleriesRes.json() : [];

        setJobs(jobsData || []);
        setGalleries(galleriesData || []);
      } catch (err) {
        console.error("Error loading data:", err);
        setJobs([]);
        setGalleries([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const handleGlobalContextMenu = (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
        e.preventDefault();
        toast.info("Content protection enabled");
        return false;
      }
    };

    const handleGlobalDragStart = (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
        e.preventDefault();
        return false;
      }
    };

    const handleSelectStart = (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleGlobalContextMenu);
    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleGlobalContextMenu);
      document.removeEventListener('dragstart', handleGlobalDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6fbff]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-[#325160] mx-auto rounded-full"></div>
          <p className="mt-4 text-[#395563]">Loading...</p>
        </div>
      </div>
    );
  }

  const visibleJobs = jobs.filter((j) => j?.status !== "Inactive");

  const limitWords = (text, limit = 5) => {
    if (!text) return "";
    const words = text.toString().trim().split(/\s+/);
    return words.length > limit
      ? words.slice(0, limit).join(" ") + "..."
      : text;
  };

return (
  <>
    {/* GLOBAL TOAST */}
    {toastMsg && (
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
    )}

    <div
      className="min-h-screen bg-[#f6fbff] pb-24"
      style={{ userSelect: "none" }}
    >
      {/* HEADER */}
      <div className="text-center mt-10 mb-16 px-4">
        <p className="text-[14px] uppercase tracking-[0.2em] text-[#395563] mb-2">
          Explore
        </p>
        <h1 className="text-[32px] text-[#345261] font-semibold">
          Current Openings at Spangles Webx
        </h1>
      </div>

      {/* ---------------- JOB LIST ---------------- */}
      {visibleJobs.length > 0 ? (
        <div
          className={`max-w-5xl mx-auto grid gap-8 px-4 ${
            visibleJobs.length === 1
              ? "grid-cols-1"
              : "grid-cols-1 md:grid-cols-2"
          }`}
        >
          {visibleJobs.map((job) => (
            <div
              key={job._id}
              className="job-card bg-white p-6 rounded-2xl shadow-md border border-gray-100"
            >
              <div className="w-full mb-6 flex items-center px-4 py-2 bg-[#325160] rounded-lg">
                <span className="pill bg-[#e8f4fd] text-[#325160] px-3 py-1 rounded-full text-sm font-semibold">
                  {job.jobType}
                </span>
                <div className="flex-1" />
                <span className="font-semibold text-white">{job.location}</span>
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-xl text-[#395563] font-semibold">
                  {job.jobTitle}
                </h2>
                <button
                  className="btn-know-more border border-[#325160] px-4 py-2 rounded-lg font-semibold text-[#325160] hover:bg-[#325160] hover:text-white transition-colors"
                  onClick={() => setPreviewJob(job)}
                >
                  Know more →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 text-center py-12">
          <p className="text-gray-500">No job openings available at the moment.</p>
        </div>
      )}

      {/* ---------------- GALLERY SECTION ---------------- */}
      {galleries.length > 0 && (
        <div className="max-w-5xl mx-auto mt-16 px-4">
          <h2 className="text-2xl font-semibold text-[#345261] mb-6">Gallery</h2>

          {galleries.map((gallery) =>
            gallery?.items?.length > 0 ? (
              <div key={gallery._id} className="mb-12">
                <div className="border border-gray-300 rounded-xl p-6 bg-white shadow-sm">
                  {gallery.title && (
                    <h3 className="text-xl font-semibold mb-4">{gallery.title}</h3>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {gallery.items.map((item, idx) => (
                      <GalleryImage key={idx} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* ---------------- BLOG SECTION ---------------- */}
      <div className="max-w-5xl mx-auto mt-16 px-4">
        <h2 className="text-2xl font-semibold text-[#345261] mb-6">Blogs</h2>

        {blogs.length === 0 ? (
          <p className="text-gray-500">No blogs available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div
                key={blog._id}
                className="h-[160px] bg-white border border-gray-200 rounded-[10px] overflow-hidden flex cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/blogs/preview/${blog._id}`)}
              >
                <div className="w-[160px] h-full flex-shrink-0">
                  <img
                    src={`${API_BASE}${blog.image}`}
                    alt={blog.title}
                    className="w-full h-full object-cover rounded-tl-[10px] rounded-bl-[10px]"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col px-5 py-4">
                  <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                    <FaRegClock className="text-[11px]" />
                    <span className="font-medium">
                      {new Date(blog.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="font-semibold text-xs leading-tight pt-3 overflow-hidden text-ellipsis line-clamp-2">
                    {limitWords(blog.title, 5)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- JOB MODAL ---------------- */}
      {previewJob && (
        <JobModal
          job={previewJob}
          onClose={() => setPreviewJob(null)}
          showToast={(msg) => setToastMsg(msg)} // ensures modal can trigger toast
        />
      )}
    </div>
  </>
);

}