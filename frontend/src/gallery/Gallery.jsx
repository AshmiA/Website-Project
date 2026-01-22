import { useState, useEffect, useCallback } from "react";
import { FaTrash, FaUpload, FaEdit, FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const GalleryItem = ({ item, galleryId, onDeleteClick }) => {
  const [orientation, setOrientation] = useState('landscape');

  const handleImageLoad = (e) => {
    const img = e.target;
    const isPortrait = img.naturalHeight > img.naturalWidth;
    setOrientation(isPortrait ? 'portrait' : 'landscape');
  };

  useEffect(() => {
    if (item.type === 'image' && item.url) {
      const img = new Image();
      img.onload = () => {
        const isPortrait = img.naturalHeight > img.naturalWidth;
        setOrientation(isPortrait ? 'portrait' : 'landscape');
      };
      img.src = `${API_BASE}${item.url}`;
    }
  }, [item.url, item.type]);

  return (
    <div className="group relative rounded-xl overflow-hidden bg-white "
         style={{ height: "240px" }}>

      <div className="w-full h-full flex items-center justify-center bg-white p-3">
        {item.type === "image" ? (
          <img
            src={`${API_BASE}${item.url}`}
            className={
              orientation === 'portrait' 
                ? 'h-full w-auto max-h-full object-contain rounded-lg' 
                : 'w-full h-full object-cover rounded-lg'
            }
            alt=""
            onLoad={handleImageLoad}
          />
        ) : (
          <video
            src={`${API_BASE}${item.url}`}
            className="w-full h-full object-contain rounded-lg"
            controls
          />
        )}
      </div>

      {/* DELETE INDIVIDUAL ITEM BUTTON */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 py-2 flex items-center justify-center">
        <button
          onClick={() => onDeleteClick(galleryId, item)}
          className="text-red-600 hover:text-red-800 flex items-center gap-2 font-medium text-sm mb-2"
        >
          <FaTrash className="text-red-500" /> Delete
        </button>
      </div>
    </div>
  );
};

// Main Gallery Component
export default function Gallery() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [galleries, setGalleries] = useState([]);
  const [tempTitle, setTempTitle] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editGallery, setEditGallery] = useState(null);
  const [galleryDeleteConfirm, setGalleryDeleteConfirm] = useState(null);

  // --------------------------- LOAD GALLERIES ---------------------------
  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/gallery`);
    const data = await res.json();

    if (Array.isArray(data)) {
      setGalleries(
        data.map(g => ({
          ...g,
          items: Array.isArray(g.items) ? g.items : []
        }))
      );
    } else {
      setGalleries([]);
    }
  } catch (err) {
    console.error("Failed to load galleries:", err);
    setGalleries([]);
  }
};

  const openUploadModal = () => {
    setTempTitle("");
    setUploadFiles([]);
    setEditGallery(null);
    setShowUploadModal(true);
  };

  // Open edit modal with existing gallery data
  const openEditModal = (gallery) => {
    setTempTitle(gallery.title || "");
    setUploadFiles([]);
    setEditGallery(gallery);
    setShowUploadModal(true);
  };

  // --------------------------- FILE UPLOAD ---------------------------
  const handleFilesUpload = (e) => {
    const files = Array.from(e.target.files || []);

    const mapped = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      src: URL.createObjectURL(file),
      type: file.type.includes("video") ? "video" : "image",
      name: file.name,
    }));

    setUploadFiles((prev) => [...prev, ...mapped]);
  };

  // --------------------------- SUBMIT UPLOAD/EDIT ---------------------------
  const handleUploadSubmit = async () => {
    if (uploadFiles.length === 0 && !editGallery) {
      toast.error("Please select at least one file");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("title", tempTitle || "");
      uploadFiles.forEach((f) => fd.append("files", f.file));

      let res;
      if (editGallery) {
        // Update existing gallery
        res = await fetch(`${API_BASE}/api/gallery/${editGallery._id}`, {
          method: "PUT",
          body: fd,
        });
      } else {
        // Create new gallery
        res = await fetch(`${API_BASE}/api/gallery`, {
          method: "POST",
          body: fd,
        });
      }

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || (editGallery ? "Update failed" : "Upload failed"));
        return;
      }

      const updatedGallery = await res.json();

      if (editGallery) {
        // Update existing gallery in state
        setGalleries((prev) =>
          prev.map((g) => (g._id === editGallery._id ? updatedGallery : g))
        );
        toast.success("Gallery updated successfully!");
      } else {
        // Add new gallery to state
        setGalleries((prev) => [updatedGallery, ...prev]);
        toast.success("Gallery created successfully!");
      }

      setTempTitle("");
      setUploadFiles([]);
      setEditGallery(null);
      setShowUploadModal(false);
    } catch (err) {
      console.error(editGallery ? "Update error:" : "Upload error:", err);
      toast.error(editGallery ? "Update failed" : "Upload failed");
    }
  };

  // --------------------------- REMOVE FILE BEFORE UPLOAD ---------------------------
  const removeUploadFile = (id) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // --------------------------- DELETE ITEM ---------------------------
 
const handleDelete = async (galleryId, item) => {
  try {
    const filename = item.url.split("/").pop();

    const res = await fetch(
      `${API_BASE}/api/gallery/${galleryId}/item/${filename}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Delete failed");
    }

    const result = await res.json();

    setGalleries(prev =>
      prev.map(g =>
        g._id === galleryId
          ? { ...g, items: result.items || [] }
          : g
      )
    );

    toast.success("Item deleted successfully");
    setDeleteConfirm(null);
  } catch (err) {
    console.error(err);
    toast.error(err.message || "Delete failed");
  }
};

  // Handler for delete button click
  const handleDeleteClick = useCallback((galleryId, item) => {
    setDeleteConfirm({ galleryId, item });
  }, []);

  // --------------------------- DELETE GALLERY ---------------------------
  const handleDeleteGallery = async (galleryId) => {
    try {
      const res = await fetch(`${API_BASE}/api/gallery/${galleryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Delete failed");
      }

      // Remove gallery from state
      setGalleries((prev) => prev.filter((g) => g._id !== galleryId));
      setGalleryDeleteConfirm(null);
      toast.success("Gallery deleted successfully");
    } catch (err) {
      console.error("Gallery delete failed:", err);
      toast.error(err.message || "Gallery delete failed");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex justify-center">
      <div className="w-full max-w-[1400px] mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Gallery</h1>

          <button
            onClick={openUploadModal}
            className="px-5 py-3 bg-[#345261] text-white rounded-lg flex items-center gap-2 hover:bg-[#2a4250] transition shadow"
          >
            <FaUpload />
            Upload Photos
          </button>
        </div>

        {/* EMPTY MESSAGE */}
        {galleries.length === 0 && (
          <p className="text-center text-gray-500 py-20">
            No galleries created yet.
          </p>
        )}

        {/* GALLERIES */}
        {galleries.map((gallery) => (
        
          <div key={gallery._id} className="mb-12">
            <div className="border border-gray-300 rounded-lg p-4 w-full bg-white shadow relative">
              
              {/* GALLERY HEADER WITH TITLE AND ACTION BUTTONS */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  {gallery.title && (
                    <h2 className="text-lg font-semibold">{gallery.title}</h2>
                  )}
                  </div>
                  {/* EDIT AND DELETE GALLERY BUTTONS - LEFT SIDE */}
                  <div className="flex gap-2 ml-auto ">

                    <button
                      onClick={() => openEditModal(gallery)}
                      className="text-[#345261] hover:text-[#2a4250] p-2 rounded-full hover:bg-gray-100 transition"
                      title="Edit Gallery"
                    >
                      <FaEdit size={18} />
                    </button>
                    
                    <button
                      onClick={() => setGalleryDeleteConfirm(gallery)}
                      className="text-[#345261] hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition"
                      title="Delete Gallery"
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </div>
              

              {/* 3 COLUMN GRID */}

<div className="grid grid-cols-4 gap-6 w-full">
  {Array.isArray(gallery.items) && gallery.items.length > 0 ? (
    gallery.items.map((item, idx) => (
      <GalleryItem
        key={`${gallery._id}-${idx}`}
        item={item}
        galleryId={gallery._id}
        onDeleteClick={handleDeleteClick}
      />
    ))
  ) : (
    <div className="col-span-4 text-center text-gray-400 py-10">
      No images in this gallery
    </div>
  )}
</div>



            </div>
          </div>
        ))}


   {/* UPLOAD/EDIT MODAL */}
{showUploadModal && (
  <>
    <div
      className="fixed inset-0 bg-black/50 z-40"
      onClick={() => {
        if (
          uploadFiles.length > 0 &&
          !window.confirm("Discard selected files?")
        )
          return;
        setShowUploadModal(false);
        setTempTitle("");
        setUploadFiles([]);
        setEditGallery(null);
      }}
    />

    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER - WITH CLOSE ICON */}
        <div className="p-6 relative">
         
          
          {/* CLOSE (X) ICON */}
          <button
            onClick={() => {
              if (
                uploadFiles.length > 0 &&
                !window.confirm("Discard selected files?")
              )
                return;
              setShowUploadModal(false);
              setTempTitle("");
              setUploadFiles([]);
              setEditGallery(null);
            }}
            className="absolute top-6 right-6 text-gray-500 hover:text-gray-800"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Title Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-3 text-gray-700">
              Title
            </label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              placeholder="Enter gallery title"
            />
          </div>

          {/* Dropzone */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-3 text-gray-700">
              Add Files
            </label>
            <div className="relative">
              <label
                htmlFor="filePicker"
                className="block border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <FaUpload className="text-gray-400 mx-auto mb-4" size={40} />
                <p className="text-lg text-gray-700 mb-2">
                  Drop your images/videos here, or browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports JPG, PNG, GIF, MP4, MOV
                </p>

                <input
                  id="filePicker"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFilesUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Horizontal Separator */}
          <div className="border-t border-gray-200 my-8"></div>
          <div>
        
            {editGallery &&
 Array.isArray(editGallery.items) &&
 editGallery.items.length > 0 && (

              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-gray-800">
                  Existing Gallery Items
                </h3>
                <div className="grid grid-cols-4 gap-4">
                 
                  {Array.isArray(editGallery.items) &&
 editGallery.items.map((item, idx) => (

                    <div
                      key={idx}
                      className="relative overflow-hidden rounded-lg bg-gray-100 border border-gray-200 group"
                      style={{ height: "100px" }}
                    >
                      <div className="w-full h-full flex items-center justify-center p-1">
                        {item.type === "image" ? (
                          <img
                            src={`${API_BASE}${item.url}`}
                            className="max-h-full max-w-full object-cover rounded"
                            alt=""
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://placehold.co/100x100/e0e0e0/666?text=IMG`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="text-xs mb-1">VIDEO</div>
                              <div className="text-xl">▶</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* DELETE/REMOVE ICON FOR EXISTING ITEMS */}
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to remove this item from the gallery?")) {
                            // Call delete API for this specific item
                            handleDelete(editGallery._id, item);
                            // Close the modal and refresh
                            setShowUploadModal(false);
                            loadGalleries();
                          }
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        title="Remove item"
                      >
                        ✕
                      </button>
                      
                      {/* Item number indicator */}
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs rounded px-2 py-1">
                        #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click the ✕ icon to remove items from the gallery
                </p>
              </div>
            )}

            {uploadFiles.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">
                  New Files
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {uploadFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative overflow-hidden rounded-lg bg-gray-100 border border-gray-200"
                      style={{ height: "100px" }}
                    >
                      <div className="w-full h-full flex items-center justify-center p-1">
                        {file.type === "image" ? (
                          <img
                            src={file.src}
                            className="max-h-full max-w-full object-cover rounded"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="text-xs mb-1">VIDEO</div>
                              <div className="text-xl">▶</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeUploadFile(file.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER - SIMPLE BUTTONS */}
        <div className="p-6 border-t flex justify-end gap-4">
          <button
            onClick={() => {
              if (
                uploadFiles.length > 0 &&
                !window.confirm("Discard changes?")
              )
                return;
              setShowUploadModal(false);
              setTempTitle("");
              setUploadFiles([]);
              setEditGallery(null);
            }}
            className="px-6 py-3 text-red-600  rounded-lg  font-medium"
          >
            Discard
          </button>

          <button
  onClick={handleUploadSubmit}
  disabled={uploadFiles.length === 0 && !editGallery}
  className={`px-6 py-3 rounded-lg font-medium ${
    uploadFiles.length > 0 || editGallery
      ? "text-white"
      : "bg-gray-200 text-gray-400 cursor-not-allowed"
  }`}
  style={
    uploadFiles.length > 0 || editGallery
      ? { backgroundColor: "#325160" }
      : {}
  }
  onMouseEnter={(e) => {
    if (uploadFiles.length > 0 || editGallery)
      e.target.style.backgroundColor = "#29424D"; // darker hover color
  }}
  onMouseLeave={(e) => {
    if (uploadFiles.length > 0 || editGallery)
      e.target.style.backgroundColor = "#325160";
  }}
>
  {editGallery ? "Update Gallery" : "Upload"}
</button>

        </div>
      </div>
    </div>
  </>
)}
        {deleteConfirm && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setDeleteConfirm(null)}
            />

            <div className="fixed inset-0 flex justify-center items-center z-50">
              <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
                <div className="mb-4 text-center">
                  <div className="overflow-hidden mx-auto w-48 h-48 flex items-center justify-center bg-gray-50">
                    {deleteConfirm.item.type === "image" ? (
                      <img
                        src={`${API_BASE}${deleteConfirm.item.url}`}
                        className="max-h-full max-w-full object-contain"
                        alt=""
                      />
                    ) : (
                      <video
                        src={`${API_BASE}${deleteConfirm.item.url}`}
                        className="max-h-full max-w-full object-contain"
                        controls
                      />
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-center mb-2">
                  Delete Item?
                </h3>

                <p className="text-center text-gray-600 mb-6">
                  Are you sure you want to delete this item?
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-6 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(deleteConfirm.galleryId, deleteConfirm.item)
                    }
                    className="px-6 py-2 bg-red-600 text-red rounded "
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* DELETE GALLERY CONFIRM MODAL */}
        {galleryDeleteConfirm && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setGalleryDeleteConfirm(null)}
            />

            <div className="fixed inset-0 flex justify-center items-center z-50">
              <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
                <div className="mb-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-100 rounded-full">
                    <FaTrash className="text-red-600 text-2xl" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-center mb-2">
                  Delete Gallery?
                </h3>

                <p className="text-center text-gray-600 mb-6">
                  Are you sure you want to delete the entire gallery "<strong>{galleryDeleteConfirm.title}</strong>"? 
                  {/* This will delete all {galleryDeleteConfirm.items.length} items in this gallery. */}
                  This will delete all {galleryDeleteConfirm.items?.length || 0} items

                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setGalleryDeleteConfirm(null)}
                    className="px-6 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleDeleteGallery(galleryDeleteConfirm._id)}
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete Gallery
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

 {/* Toast Container with custom styling */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
<style>
{`
  /* PROGRESS BAR */
  .Toastify__progress-bar,
  .Toastify__progress-bar--animated,
  .Toastify__progress-bar-theme--light,
  .Toastify__progress-bar-theme--colored {
    background-color: #345261 !important;
    height: 4px !important;
    transform-origin: left !important;
    animation: gallery-progress 3000ms linear forwards !important;
  }

  @keyframes gallery-progress {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }

  /* TOAST BOX */
  .Toastify__toast {
    background-color: white !important;
    color: black !important;
    border: 1px solid #dfe8ee !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15) !important;
    padding: 12px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    overflow: hidden !important;
  }

  /* Ensure transitions keep white bg */
  .Toastify__toast--enter,
  .Toastify__toast--exit,
  .Toastify__toast-body {
    background-color: white !important;
  }

  /* SUCCESS TICK ICON COLOR */
  .Toastify__toast-icon svg {
    fill: #345261 !important;
    color: #345261 !important;
  }
`}
</style>


      </div>
    </div>
  );
}
