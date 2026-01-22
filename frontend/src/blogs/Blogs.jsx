import { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaPlus,
  FaArrowLeft,
  FaTrash,
  FaEdit,
  FaCalendarAlt,
  FaRegClock,
} from "react-icons/fa";
import JoditEditor from "jodit-react";
import "jodit/es5/jodit.min.css";

const API_BASE = "http://localhost:5000";

/* Compact toolbar CSS + Content View CSS */
const toolbarCSS = `
.jodit-toolbar__box { height: 34px !important; min-height: 34px !important; }
.jodit-toolbar-button { padding: 0 4px !important; }
.jodit-toolbar-button__button { min-width: 26px !important; height: 26px !important; }
.jodit-workplace { margin-top: 2px !important; }
.jodit-status-bar { display: none !important; }

.content-view h1 { font-size: 1.875rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
.content-view h2 { font-size: 1.5rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
.content-view h3 { font-size: 1.25rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
.content-view p { margin-bottom: 1rem; line-height: 1.6; }
.content-view ul, .content-view ol { margin-left: 1.5rem; margin-bottom: 1rem; }
.content-view li { margin-bottom: 0.25rem; }
.content-view strong { font-weight: bold; }
.content-view em { font-style: italic; }
.content-view u { text-decoration: underline; }
.content-view blockquote { border-left: 4px solid #ccc; padding-left: 1rem; margin: 1rem 0; font-style: italic; }
.content-view ul li { list-style-type: disc; }
.content-view ol li { list-style-type: decimal; }
`;

/* Format Date */
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* Toast Component */
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80">
      <span className="text-sm text-gray-800">{message}</span>
      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
        <div className="bg-[#345261] h-1 rounded-full toast-progress"></div>
      </div>
    </div>
  );
}

/* MAIN COMPONENT */
export default function Blogs() {
  const [page, setPage] = useState("list");
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const editor = useRef(null);
  const fileInputRef = useRef(null);

  const [toast, setToast] = useState(null);

  /* Inject Toolbar CSS */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = toolbarCSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  /* Fetch Blogs */
  const fetchBlogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blogs`);
      const data = await res.json();
      setBlogs(data);
    } catch (err) {
      console.error("Error loading blogs:", err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  /* Image Preview Handler */
  useEffect(() => {
    if (!imageFile) {
      if (!isEditing || !selectedBlog) setImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile, isEditing, selectedBlog]);

  const filteredBlogs = blogs.filter((b) =>
  (b.title ?? "")
    .toLowerCase()
    .includes(search.toLowerCase())
);

  /* Upload Blog */
  const uploadBlog = async () => {
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
     

      formData.append("image", imageFile);

      const res = await fetch(`${API_BASE}/api/blogs`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setBlogs([data, ...blogs]);
      setSelectedBlog(data);
      resetEditor();
      setPage("view");
      setToast("Blog uploaded successfully!");
    } catch {
      setToast("Failed to upload blog");
    }
  };

  /* Update Blog */
  const updateBlog = async () => {
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`${API_BASE}/api/blogs/${selectedBlog._id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      setBlogs((prev) =>
        prev.map((b) => (b._id === selectedBlog._id ? data : b))
      );

      setSelectedBlog(data);
      setIsEditing(false);
      setPage("view");
      setToast("Blog updated successfully!");
    } catch {
      setToast("Failed to update blog");
    }
  };

  /* Delete Blog */
  const deleteBlog = async (id) => {
    await fetch(`${API_BASE}/api/blogs/${id}`, { method: "DELETE" });
    setBlogs(blogs.filter((b) => b._id !== id));
    setToast("Blog deleted successfully!");
  };

  /* Reset Editor */
  const resetEditor = () => {
    setTitle("");
    setContent("");
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(false);
  };

  /* Handle Image File */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* GLOBAL TOAST */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* LIST PAGE */}
      {page === "list" && (
        <>
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border mb-6">
            <h2 className="text-lg font-semibold">Blogs</h2>

            <div className="flex items-center gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-2 text-gray-400" />
                <input
                  className="pl-10 pr-4 py-2 border rounded w-64 text-sm"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={() => {
                  resetEditor();
                  setPage("add");
                }}
                className="flex items-center gap-2 bg-[#23414a] text-white px-4 py-2 rounded"
              >
                <FaPlus /> New Blogs
              </button>
            </div>
          </div>

          {/* BLOG GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <div
                key={blog._id}
                className="w-[344px] bg-white rounded-2xl border shadow-sm overflow-hidden flex"
                style={{ height: "160px" }}
              >
                <div className="w-[140px] h-full">
                  <img
                    src={`${API_BASE}${blog.image}`}
                    className="w-full h-full object-cover rounded-l-2xl"
                    alt="blog"
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="px-4 py-3 flex-1">
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <FaRegClock className="text-gray-500 text-xs" />
                      <span className="text-xs font-medium">
                        {formatDate(blog.createdAt)}
                      </span>
                    </div>

                    <p className="font-semibold text-sm leading-tight mb-1 pt-3">
                      {blog.title}
                    </p>
                  </div>

                  <div className="h-6 flex border-t">
                    <button
                      onClick={() => deleteBlog(blog._id)}
                      className="flex items-center justify-center text-red-500 hover:bg-red-50 text-sm font-medium w-1/2"
                    >
                      <FaTrash /> Delete
                    </button>

                    <div className="w-px bg-gray-300 h-full"></div>

                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setSelectedBlog(blog);
                        setTitle(blog.title);
                        setContent(blog.content);
                       
                        setImagePreview(`${API_BASE}${blog.image}`);
                        setImageFile(null);
                        setPage("add");
                      }}
                      className="flex items-center justify-center text-[#345261] text-sm font-medium w-1/2"
                    >
                      <FaEdit /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ADD / EDIT PAGE */}
      {page === "add" && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? "Edit Blog" : "New Blog"}
          </h2>

          <label className="block font-medium mb-1">Title</label>
          <input
            className="w-full border px-3 py-2 rounded mb-4"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="block font-medium mb-1">Content</label>
          <div className="border border-gray-300 rounded-lg mb-4 overflow-hidden">
            
            <JoditEditor
  ref={editor}
  value={content}
  onBlur={(newContent) => setContent(newContent)}
  config={{
    height: 400,
    toolbarAdaptive: false,
    toolbarSticky: false,
    statusbar: false,

    // 🚫 Disable "Paste as HTML" popup
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    pasteHTMLAction: "insert",
    defaultActionOnPaste: "insert_clear_html",

    buttons: [
      "bold", "italic", "underline", "strikethrough",
      "ul", "ol",
      "outdent", "indent",
      "left", "center", "right", "justify",
      "font", "fontsize", "brush"
    ],
  }}
/>

          </div>

          <label className="block font-semibold mb-2">Upload Image</label>

          <div className="flex items-start gap-4 mb-4">
            <div
              className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer w-[300px] h-[200px]"
              onClick={() => fileInputRef.current.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  className="w-full h-full object-cover rounded"
                  alt="Preview"
                />
              ) : (
                <>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2659/2659360.png"
                    className="w-10 opacity-60"
                    alt="upload"
                  />
                  <p className="mt-2 text-gray-500 text-sm">Upload Image</p>
                </>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => {
                if (imagePreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(imagePreview);
                }
                setToast("Draft discarded");
                setPage("list");
              }}
              className="text-red-500 font-semibold"
            >
              Discard
            </button>

            <button
              onClick={() => (isEditing ? updateBlog() : uploadBlog())}
              className="bg-[#23414a] text-white px-6 py-2 rounded"
              disabled={!title || !content || (!imageFile && !imagePreview)}
            >
              {isEditing ? "Save Changes" : "Upload"}
            </button>
          </div>
        </div>
      )}

      {/* VIEW BLOG PAGE */}
      {page === "view" && selectedBlog && (
        <div className="w-full flex justify-center py-10 px-4">
          <div className="w-full max-w-[1020px] bg-white border rounded-lg p-6 shadow-sm">
            <button
              onClick={() => setPage("list")}
              className="flex items-center gap-2 text-[#23414a] mb-6"
            >
              <FaArrowLeft /> Back
            </button>

            <h1 className="text-2xl font-semibold mb-4">{selectedBlog.title}</h1>

            <div className="flex gap-2 text-gray-500 text-sm mb-6">
              <FaCalendarAlt className="text-[#23414a]" />
              {formatDate(selectedBlog.createdAt)} •{" "}
              {new Date(selectedBlog.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            <img
              src={`${API_BASE}${selectedBlog.image}`}
              className="w-full h-[351px] object-cover rounded mb-6"
              alt=""
            />

            <div
              className="content-view text-justify"
              dangerouslySetInnerHTML={{ __html: selectedBlog.content }}


              style={{ lineHeight: "1.6", fontSize: "16px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

