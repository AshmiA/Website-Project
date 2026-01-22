import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCalendarAlt } from "react-icons/fa";

const API_BASE =
  process.env.REACT_APP_BACKEND_API_URL || "http://localhost:5000";

export default function BlogPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/blogs/${id}`);
        const data = await res.json();
        setBlog(data);
      } catch (err) {
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  const isValidDate = (date) => {
    return date && !isNaN(new Date(date).getTime());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-500">Loading blog...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-red-500">Blog not found</p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center py-10 px-4">
      <div className="w-full max-w-[1020px] bg-white rounded-xl shadow-sm p-6">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#23414a] font-medium mb-4"
        >
          <FaArrowLeft /> Back
        </button>

        {/* DATE */}
        {isValidDate(blog.createdAt) && (
          <p className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <FaCalendarAlt />
            {new Date(blog.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}

        {/* TITLE */}
        <h1 className="text-2xl font-semibold mb-6 text-center text-gray-900">
          {blog.title}
        </h1>

        {/* IMAGE */}
        {blog.image && (
          <img
            src={`${API_BASE}${blog.image}`}
            alt={blog.title}
            className="w-full h-[351px] object-cover rounded-lg mb-8"
          />
        )}

        {/* CONTENT */}
        <div
          className="content-view w-full text-justify leading-7 text-gray-800"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </div>
    </div>
  );
}
