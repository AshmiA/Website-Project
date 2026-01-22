import { useState, useEffect } from "react";
import { FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import { HiOutlineTrash } from "react-icons/hi";

/* ---------------- CUSTOM BILL-STYLE TOAST ---------------- */
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
/* ---------------------------------------------------------- */

const ACCESS_LIST = [
  { key: "job", label: "Job Post" },
  { key: "blogs", label: "Blogs" },
  { key: "gallery", label: "Gallery" },
  { key: "applicants", label: "Applicants" },
  { key: "invoice", label: "Invoice" },
  { key: "quotation", label: "Quotation" }
];

const emptyAccess = {
  job: false,
  blogs: false,
  gallery: false,
  applicants: false,
  invoice: false,
  quotation: false
};

const fullAccess = {
  job: true,
  blogs: true,
  gallery: true,
  applicants: true,
  invoice: true,
  quotation: true
};

const isFullAccess = (access = {}) =>
  ACCESS_LIST.every(a => access?.[a.key]);

export default function UserAccess() {
  const [screen, setScreen] = useState("list");
  const [search, setSearch] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    username: "",
    password: "",
    role: "user",
    access: emptyAccess
  });

  /* ---------------- FETCH USERS ---------------- */
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("http://localhost:5000/api/users");
    const data = await res.json();
    setUsers(data);
  };

  /* ---------------- DELETE USER ---------------- */
  const deleteUser = async (id) => {
    await fetch(`http://localhost:5000/api/users/${id}`, { method: "DELETE" });

    setToastMsg("User deleted successfully!");
    setShowDelete(false);
    setScreen("list");
    fetchUsers();
  };

  /* ---------------- ADD USER ---------------- */
  const handleAddUser = async () => {
    const payload = {
      ...form,
      access: form.role === "admin" ? fullAccess : form.access
    };

    const res = await fetch("http://localhost:5000/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok) {
      setToastMsg(result.message || "Failed to add user");
      return;
    }

    setToastMsg("User created successfully!");
    setScreen("list");
    fetchUsers();
  };

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setForm({ ...form, phone: value });
    }
  };

  /* ====================== LIST ====================== */
  if (screen === "list") {
    return (
      <>
        {/* GLOBAL TOAST */}
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

        <div className="max-w-6xl mx-auto pt-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">User List</h2>

            <div className="flex gap-3">
              <input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border px-3 py-2 rounded text-sm"
              />
              <button
                onClick={() => {
                  setForm({
                    name: "",
                    phone: "",
                    username: "",
                    password: "",
                    role: "user",
                    access: emptyAccess
                  });
                  setScreen("add");
                }}
                className="bg-[#345261] text-white px-4 py-2 rounded flex gap-2"
              >
                <FaPlus /> New User
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden text-center">
            <table className="w-full text-sm">
              <thead className="bg-[#345261] text-white">
                <tr>
                  <th className="p-4">Sl No</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>User Name</th>
                  <th>User Type</th>
                  <th>Access</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u._id} className="border-b hover:bg-gray-50">
                    <td className="py-4">{String(i + 1).padStart(2, "0")}</td>
                    <td>{u.name}</td>
                    <td>{u.phone}</td>
                    <td>{u.username}</td>
                    <td className="capitalize">{u.role}</td>
                    <td className="font-medium">
                      {u.role === "admin" || isFullAccess(u.access)
                        ? "Full Access"
                        : "Limited Access"}
                    </td>
                    <td>
                      <button
                        className="text-[#345261]"
                        onClick={() => {
                          setSelectedUser(u);
                          setScreen("view");
                        }}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>

        {/* Toast Animation */}
        <style>{`
          @keyframes progressBar {
            from { width: 100%; }
            to { width: 0%; }
          }
          .toast-progress {
            animation: progressBar 3s linear forwards;
          }
        `}</style>
      </>
    );
  }

  /* ====================== ADD ====================== */
  if (screen === "add") {
    return (
      <>
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

        <div className="bg-white p-6 max-w-3xl mx-auto rounded-xl border">
          <h2 className="font-semibold text-lg mb-8">New User</h2>

          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border px-4 py-3 rounded-lg"
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Phone Number</label>
              <input
                value={form.phone}
                onChange={handlePhoneChange}
                className="w-full border px-4 py-3 rounded-lg"
                placeholder="10 digit number"
                maxLength={10}
              />
            </div>
          </div>

<div className="grid grid-cols-2 gap-6 mb-6">
      {/* USERNAME */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          User Name
        </label>
        <input
          type="text"
          name="new-username"
          autoComplete="off"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
          className="w-full border border-gray-300 px-4 py-3 rounded-lg"
          placeholder="Enter username"
        />
      </div>

      {/* PASSWORD WITH EYE */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Set Password
        </label>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="new-password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full border border-gray-300 px-4 py-3 pr-12 rounded-lg"
            placeholder="Enter password"
          />

          {/* EYE ICON */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>
    </div>
          {/* USER TYPE SWITCH */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 pb-6">
              User Type
            </label>

            <div className="relative inline-flex w-44 h-12 bg-gray-200 rounded-full p-1">
              <div
                className={`absolute top-1 left-1 w-1/2 h-10 bg-[#345261] rounded-full transition-all duration-300
                  ${form.role === "admin" ? "translate-x-full" : ""}`}
              />

              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, role: "user", access: emptyAccess })
                }
                className={`relative z-10 w-1/2 text-sm ${
                  form.role === "user" ? "text-white" : "text-gray-600"
                }`}
              >
                User
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, role: "admin", access: fullAccess })
                }
                className={`relative z-10 w-1/2 text-sm ${
                  form.role === "admin" ? "text-white" : "text-gray-600"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* ACCESS CHECKBOXES */}
          <p className="font-medium mb-4">Access To</p>
          <div className="flex gap-6 flex-wrap mb-8">
            {ACCESS_LIST.map(a => (
              <label key={a.key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  disabled={form.role === "admin"}
                  checked={form.access[a.key]}
                  onChange={e =>
                    setForm({
                      ...form,
                      access: {
                        ...form.access,
                        [a.key]: e.target.checked
                      }
                    })
                  }
                  className="accent-[#345261] w-5 h-5"
                />
                {a.label}
              </label>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setScreen("list")}
              className="px-8 py-3 text-red-500 hover:bg-red-50 rounded-lg"
            >
              Discard
            </button>
            <button
              onClick={handleAddUser}
              className="bg-[#345261] text-white px-8 py-3 rounded-lg"
            >
              Set Access
            </button>
          </div>
        </div>

        {/* Toast Animation */}
        <style>{`
          @keyframes progressBar {
            from { width: 100%; }
            to { width: 0%; }
          }
          .toast-progress {
            animation: progressBar 3s linear forwards;
          }
        `}</style>
      </>
    );
  }

  /* ====================== VIEW ====================== */
  return (
    <>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

      <div className="bg-white p-6 max-w-4xl mx-auto rounded-xl border relative pt-9">
        <button
          onClick={() => setShowDelete(true)}
          className="absolute top-4 right-4 flex items-center gap-2 text-red-500"
        >
          <HiOutlineTrash /> Delete User
        </button>

        <h2 className="font-semibold text-lg mb-6 capitalize">
          {selectedUser.role}
        </h2>

        <div className="grid grid-cols-[180px_1fr] gap-y-3 text-sm mb-8">
          <span>Name</span><span>{selectedUser.name}</span>
          <span>Phone</span><span>{selectedUser.phone}</span>
          <span>User Name</span><span>{selectedUser.username}</span>
          <span>User Type</span><span>{selectedUser.role}</span>

          <span>Access</span>
          <span className="font-medium">
            {selectedUser.role === "admin" || isFullAccess(selectedUser.access)
              ? "Full Access"
              : "Limited Access"}
          </span>
        </div>

        <p className="font-medium mb-4">Access To</p>

        <div className="grid gap-y-2 text-sm">
          {ACCESS_LIST.map(a =>
            selectedUser.role === "admin" || selectedUser.access?.[a.key] ? (
              <div key={a.key} className="flex items-center gap-2">
                <span>•</span>
                <span>{a.label}</span>
              </div>
            ) : null
          )}
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={() => setScreen("list")}
            className="bg-[#345261] text-white px-6 py-2 rounded"
          >
            Back
          </button>
        </div>
      </div>

      {/* DELETE POPUP */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl px-10 py-8 text-center">
            <h3 className="font-semibold text-lg mb-2">Delete user?</h3>
            <p className="text-sm mb-6">Are you sure you want to delete this user?</p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDelete(false)}
                className="px-6 py-2 rounded bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={() => deleteUser(selectedUser._id)}
                className="px-6 py-2 rounded bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Animation */}
      <style>{`
        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
        .toast-progress {
          animation: progressBar 3s linear forwards;
        }
      `}</style>
    </>
  );
}
