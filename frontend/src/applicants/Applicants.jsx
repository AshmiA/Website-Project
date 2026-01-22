

import { useEffect, useState } from "react";
import { FaDownload, FaChevronDown } from "react-icons/fa";

// const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5000";


/* -------------------------------------------------------------
   DATE FORMAT
------------------------------------------------------------- */

const formatDateDisplay = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB");
};

/* -------------------------------------------------------------
   APPLICANT DETAIL PAGE — NOW USES BILL.JSX TOAST
------------------------------------------------------------- */
function ApplicantDetailPage({ applicant, onClose, onDownloadResume, onStatusChange, showToast }) {
  const [currentStatus, setCurrentStatus] = useState(applicant.status || "view");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [statusChanged, setStatusChanged] = useState(false);
  const [hasUpdatedToViewed, setHasUpdatedToViewed] = useState(false);

  /* Auto update "view" → "viewed" */
  useEffect(() => {
    if (applicant.status === "view" && !hasUpdatedToViewed) {
      const updateToViewed = async () => {
        try {
          setCurrentStatus("viewed");
          setHasUpdatedToViewed(true);

          await onStatusChange(applicant._id, "viewed");

          if (showToast) showToast("Status updated to Viewed");
        } catch (error) {
          console.error("Failed to update status:", error);
        }
      };

      updateToViewed();
    }
  }, [applicant, onStatusChange, hasUpdatedToViewed, showToast]);

  const handleStatusChange = (newStatus, e) => {
    e?.stopPropagation();
    setCurrentStatus(newStatus);
    setStatusChanged(true);
  };

  const handleDone = async () => {
    if (statusChanged && currentStatus !== applicant.status) {
      await onStatusChange(applicant._id, currentStatus);
      if (showToast) showToast("Status updated successfully");
    }
    onClose();
  };

  /* Freeze body when showing resume modal */
  useEffect(() => {
    const sidebar = document.querySelector("aside");

    if (showResumeModal) {
      document.body.style.overflow = "hidden";
      if (sidebar) sidebar.style.zIndex = "1";
    } else {
      document.body.style.overflow = "auto";
      if (sidebar) sidebar.style.zIndex = "";
    }

    return () => {
      document.body.style.overflow = "auto";
      if (sidebar) sidebar.style.zIndex = "";
    };
  }, [showResumeModal]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4">
          {/* Header */}
          <h1 className="text-2xl font-bold text-[#345261] mb-8">Applicant Summary</h1>

          {/* Details Grid */}
          <div className="p-8 grid grid-cols-[180px_1fr] gap-y-5 text-[15px]">
            <div className="text-gray-600 font-medium">Name</div>
            <div className="font-medium text-gray-800">{applicant.yourName || "—"}</div>

            <div className="text-gray-600 font-medium">Email</div>
            <div>{applicant.yourEmail || "—"}</div>

            <div className="text-gray-600 font-medium">Mobile Number</div>
            <div>{applicant.mobileNumber || "—"}</div>

            <div className="text-gray-600 font-medium">Job Title</div>
            <div>{applicant.jobTitle || "—"}</div>

            <div className="text-gray-600 font-medium">Designation</div>
            <div>{applicant.designation || "—"}</div>

            <div className="text-gray-600 font-medium">Experience</div>
            <div>{applicant.experienceYears || "—"}</div>

            <div className="text-gray-600 font-medium">Skills</div>
            <div>{applicant.skills || "—"}</div>

            <div className="text-gray-600 font-medium">Resume</div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowResumeModal(true)}
                className="underline font-medium hover:text-[#2a424a]"
                style={{ color: "#345261" }}
              >
                View Resume
              </button>
            </div>

            <div className="text-gray-600 font-medium">Salary Expectation</div>
            <div>{applicant.salaryExpectation || "—"}</div>

            <div className="text-gray-600 font-medium">Applied On</div>
            <div>{formatDateDisplay(applicant.appliedDate)}</div>

            <div className="text-gray-600 font-medium">Description</div>
            <div className="whitespace-pre-line text-gray-700">{applicant.description || "—"}</div>
          </div>

          {/* Status Selection */}
          <div className="grid grid-cols-[180px_1fr] items-center px-8 py-4">
            <div className="text-sm text-gray-600 font-medium">Status</div>

            <div className="flex items-center gap-10">
              {/* Shortlist */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={(e) => handleStatusChange("shortlist", e)}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    currentStatus === "shortlist" ? "border-green-600" : "border-green-400"
                  }`}
                >
                  {currentStatus === "shortlist" && <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>}
                </div>
                <span className="text-green-600 text-sm font-medium">Shortlist</span>
              </label>

              {/* Reject */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={(e) => handleStatusChange("rejected", e)}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    currentStatus === "rejected" ? "border-red-600" : "border-red-300"
                  }`}
                >
                  {currentStatus === "rejected" && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                </div>
                <span className="text-red-600 text-sm font-medium">Reject</span>
              </label>

              {/* Hold */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={(e) => handleStatusChange("on hold", e)}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    currentStatus === "on hold" ? "border-blue-600" : "border-blue-300"
                  }`}
                >
                  {currentStatus === "on hold" && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                </div>
                <span className="text-blue-500 text-sm font-medium">Hold</span>
              </label>
            </div>
          </div>

          {/* Done Button */}
          <div className="border-gray-200 p-8 flex justify-end">
            <button
              onClick={handleDone}
              className="px-10 py-3 bg-[#345261] text-white rounded-lg hover:bg-[#2a424a] font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------
            Resume Preview Modal
      --------------------------------------------------------- */}
      {showResumeModal && (
        <div
          className="fixed top-0 right-0 bottom-0 z-[99999] flex flex-col items-center justify-start p-4"
          style={{ left: "224px", pointerEvents: "none" }}
        >
          <div
            className="fixed top-0 right-0 bottom-0"
            style={{ left: "224px", background: "rgba(0,0,0,0.75)", zIndex: -1 }}
          ></div>

          {/* Header Icons */}
          <div className="w-full flex justify-end items-center gap-4 mb-4 pr-8 pointer-events-auto">
            <button onClick={() => onDownloadResume(applicant)} className="flex items-center gap-1 text-white text-sm">
              <FaDownload size={16} />
              <span>Download</span>
            </button>

            <button
              onClick={() => setShowResumeModal(false)}
              className="text-white flex items-center justify-center pointer-events-auto"
            >
              <div className="border border-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                ✕
              </div>
            </button>
          </div>

          {/* PDF */}
          <div
            className="pointer-events-auto"
            style={{
              width: "750px",
              height: "850px",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              overflow: "hidden",
              background: "transparent",
            }}
          >
            {applicant.pdfFile?.contentType === "application/pdf" && (
              <iframe
                src={`${API_BASE}/api/applications/resume/${applicant._id}?t=${Date.now()}#toolbar=0&navpanes=0`}
                style={{
                  width: "1900px",
                  height: "2000px",
                  border: "none",
                  transform: "scale(0.65)",
                  transformOrigin: "top center",
                  background: "transparent",
                  pointerEvents: "none",
                }}
                title="Resume Preview"
              ></iframe>
            )}

            {applicant.pdfFile?.contentType?.startsWith("image/") && (
              <img
                src={`${API_BASE}/api/applications/resume/${applicant._id}?t=${Date.now()}`}
                className="object-contain w-full h-full"
                alt="Resume"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
   MAIN APPLICANTS PAGE — GLOBAL TOAST ONLY
------------------------------------------------------------- */
export default function Applicants({ showToast }) {
  const [applicants, setApplicants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApplicants, setFilteredApplicants] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showApplicantPage, setShowApplicantPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statusOptions = [
    { value: "all", label: "Status : All" },
    { value: "view", label: "View" },
    { value: "viewed", label: "Viewed" },
    { value: "shortlist", label: "Shortlist" },
    { value: "rejected", label: "Rejected" },
    { value: "on hold", label: "On Hold" },
  ];

  /* Fetch Applicants */
  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/applications`);
      const data = await res.json();

      const fixed = data.map((a) => ({
        ...a,
        status: a.status === "new" ? "view" : a.status || "view",
      }));

      setApplicants(fixed);
    } catch {
      if (showToast) showToast("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  /* Download resume */
  const handleDownloadResume = async (applicant) => {
    try {
      const res = await fetch(`${API_BASE}/api/applications/resume/${applicant._id}`);
      const blob = await res.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${applicant.yourName}-resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      if (showToast) showToast("Download failed");
    }
  };

  /* Filtering */
  useEffect(() => {
    if (!searchTerm.trim() && statusFilter === "all") {
      setFilteredApplicants(null);
      return;
    }

    const q = searchTerm.toLowerCase();
    let result = applicants;

    if (searchTerm.trim()) {
      result = result.filter((a) =>
        `${a.yourName} ${a.designation} ${a.skills}`.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    setFilteredApplicants(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, applicants]);

  /* Status Update */
  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error();

      setApplicants((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a))
      );

      return true;
    } catch {
      if (showToast) showToast("Failed to update status");
      return false;
    }
  };

  const list = filteredApplicants || applicants;
  const indexOfLast = currentPage * recordsPerPage;
  const current = list.slice(indexOfLast - recordsPerPage, indexOfLast);
  const totalPages = Math.ceil(list.length / recordsPerPage);

  const getStatusStyle = (status) => {
    switch (status) {
      case "view": return "text-[#0067C0]";
      case "viewed": return "text-[#FFD600]";
      case "shortlist": return "text-[#009206]";
      case "rejected": return "text-[#E4261D]";
      case "on hold": return "text-[#FF7A00]";
      default: return "text-[#0067C0]";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-[#345261] rounded-full mx-auto"></div>
          <p className="mt-4 text-[#395563]">Loading applicants...</p>
        </div>
      </div>
    );
  }

  /* Render Detail Page */
  if (showApplicantPage && selectedApplicant) {
    return (
      <ApplicantDetailPage
        applicant={selectedApplicant}
        onClose={() => {
          setShowApplicantPage(false);
          setSelectedApplicant(null);
          fetchApplicants();
        }}
        onDownloadResume={handleDownloadResume}
        onStatusChange={handleStatusChange}
        showToast={showToast}
      />
    );
  }

  /* Main Table Page */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 text-[#345261]">
          <h1 className="text-2xl font-bold">Applicant List</h1>

          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"
              >
                <span>{statusOptions.find((o) => o.value === statusFilter)?.label}</span>
                <FaChevronDown size={12} className={`${showStatusDropdown ? "rotate-180" : ""}`} />
              </button>

              {showStatusDropdown && (
                <>
                  <div className="fixed inset-0" onClick={() => setShowStatusDropdown(false)} />

                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        className="w-full px-4 py-3 hover:bg-gray-50"
                        onClick={() => {
                          setStatusFilter(option.value);
                          setShowStatusDropdown(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="px-4 py-2 border rounded-lg w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y">
            <thead className="bg-[#345261] text-white text-xs uppercase">
              <tr>
                <th className="px-6 py-3">SI No</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Job Title</th>
                <th className="px-6 py-3">Designation</th>
                <th className="px-6 py-3">Experience</th>
                <th className="px-6 py-3">Applied On</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {current.length > 0 ? (
                current.map((applicant, index) => (
                  <tr
                    key={applicant._id}
                    className="hover:bg-gray-50 text-center cursor-pointer"
                    onClick={() => {
                      setSelectedApplicant(applicant);
                      setShowApplicantPage(true);
                    }}
                  >
                    <td className="px-6 py-4">{indexOfLast - recordsPerPage + index + 1}</td>
                    <td className="px-6 py-4">{applicant.yourName}</td>
                    <td className="px-6 py-4">{applicant.jobTitle}</td>
                    <td className="px-6 py-4">{applicant.designation}</td>
                    <td className="px-6 py-4">{applicant.experienceYears}</td>
                    <td className="px-6 py-4">{formatDateDisplay(applicant.appliedDate)}</td>

                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`font-medium cursor-pointer ${getStatusStyle(applicant.status)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApplicant(applicant);
                          setShowApplicantPage(true);
                        }}
                      >
                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No applicants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {list.length > recordsPerPage && (
          <div className="flex justify-center mt-6 gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 border rounded-full flex items-center justify-center disabled:opacity-40"
            >
              &lt;
            </button>

            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#345261] text-white">
              {currentPage}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 border rounded-full flex items-center justify-center disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
