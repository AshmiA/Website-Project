import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const API_BASE = "http://localhost:5000";
const ADMIN_EMAIL = "spangleswebx@gmail.com";
const OTP_LENGTH = 6;
const OTP_TIME = 180; // 3 minutes

/* ================= TOAST ================= */
function Toast({ message, onClose }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [paused, onClose]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="fixed top-4 right-4 z-[9999] bg-white border rounded-lg shadow-lg p-4 min-w-80"
    >
      <span className="text-sm">{message}</span>

      <div className="w-full bg-gray-200 h-1 mt-2 overflow-hidden">
        <div
          className={`bg-[#345261] h-1 ${
            paused ? "animate-none" : "toast-progress"
          }`}
        />
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */
const maskEmail = (email) => {
  const [n, d] = email.split("@");
  return `${n[0]}${"*".repeat(n.length - 2)}${n[n.length - 1]}@${d}`;
};

const formatTime = (sec) => {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
};

export default function Login() {
  const navigate = useNavigate();

  /* ================= STATES ================= */
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState("login"); // login | otp | reset
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpTime, setOtpTime] = useState(OTP_TIME);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [toastMsg, setToastMsg] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendConfirm, setResendConfirm] = useState(false);

  const isAdmin = form.username === "Webx Admin";

  /* ================= OTP TIMER ================= */
  useEffect(() => {
    if (step !== "otp") return;

    setOtpTime(OTP_TIME);
    const timer = setInterval(() => {
      setOtpTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  /* ================= LOGIN ================= */
  const handleLogin = async () => {
  if (!form.username || !form.password) {
    setToastMsg("Enter username and password");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/api/users`);
    const users = await res.json();

    const user = users.find(
      (u) =>
        u.username === form.username &&
        u.password === form.password
    );

    if (!user) {
      setToastMsg("Invalid username or password");
      return;
    }

    /* ✅ CLEAR OLD / PREVIOUS STATE */
    setForm({ username: "", password: "" });
    setOtp(Array(OTP_LENGTH).fill(""));
    setNewPass("");
    setConfirmPass("");
    setPasswordError("");
    setToastMsg(null);

    /* ✅ SAVE USER */
    localStorage.setItem("user", JSON.stringify(user));

    setToastMsg("Login successful");

    /* ✅ PREVENT BACK SHOWING OLD DATA */
    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 800);

  } catch (error) {
    setToastMsg("Login failed");
  } finally {
    setLoading(false);
  }
};

  /* ================= SEND / RESEND OTP ================= */
  const sendOtp = async () => {
    setShowConfirm(false);
    setResendConfirm(false);

    try {
      const res = await fetch(
        `${API_BASE}/api/users/forgot-password/send-otp`,
        { method: "POST" }
      );

      const data = await res.json();
      if (!res.ok) {
        setToastMsg(data.message || "Failed to send OTP");
        return;
      }

      setToastMsg(`OTP sent to ${maskEmail(ADMIN_EMAIL)}`);
      setOtp(Array(OTP_LENGTH).fill(""));
      setStep("otp");
    } catch {
      setToastMsg("Failed to send OTP");
    }
  };

  /* ================= OTP INPUT ================= */
  const handleOtpChange = (val, i) => {
    if (!/^\d?$/.test(val)) return;
    const copy = [...otp];
    copy[i] = val;
    setOtp(copy);
    if (val && i < OTP_LENGTH - 1)
      document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, i) => {
    if (e.key === "Backspace" && !otp[i] && i > 0)
      document.getElementById(`otp-${i - 1}`)?.focus();
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    if (otp.includes("")) {
      setToastMsg("Enter complete OTP");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/users/forgot-password/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: otp.join("") }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setToastMsg(data.message || "Invalid OTP");
        return;
      }

      setToastMsg("OTP verified");
      setStep("reset");
    } catch {
      setToastMsg("OTP verification failed");
    }
  };

  /* ================= RESET PASSWORD ================= */
  const resetPassword = async () => {
  setPasswordError("");

  // 🔴 New password empty
  if (!newPass) {
    setPasswordError("New password is required.");
    return;
  }

  // 🔴 Min length check
  if (newPass.length < 6) {
    setPasswordError("Password must be at least 6 characters long.");
    return;
  }

  // 🔴 Uppercase + Number check
  if (!/(?=.*[A-Z])(?=.*\d)/.test(newPass)) {
    setPasswordError(
      "Password must include at least Upper-case & One number."
    );
    return;
  }

  // 🔴 Confirm password empty
  if (!confirmPass) {
    setPasswordError("Confirm password is required.");
    return;
  }

  // 🔴 Password mismatch
  if (newPass !== confirmPass) {
    setPasswordError("Confirm password must match the new password.");
    return;
  }

  // ✅ API call
  try {
    const res = await fetch(
      `${API_BASE}/api/users/forgot-password/reset`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPass }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      setPasswordError(data.message || "Reset failed");
      return;
    }

    setToastMsg("Password updated successfully");
    setStep("login");
    setForm({ username: "", password: "" });
    setNewPass("");
    setConfirmPass("");
  } catch {
    setPasswordError("Password reset failed");
  }
};

  return (
    <>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* ================= CONFIRM MODAL ================= */}
{showConfirm && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[360px] h-[290px] p-6 rounded-3xl text-center">
      <p className="text-sm mb-8 pt-8">
        Are you sure you want to send OTP to <br />
        <b>{maskEmail(ADMIN_EMAIL)}</b>?
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={sendOtp}
          className="px-5 py-2 bg-[#345261] text-white rounded-lg"
        >
          Send OTP
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-5 py-2 border rounded-lg
                     text-red-600 border-red-600
                     hover:bg-red-600 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{/* ================= RESEND OTP CONFIRM (ONLY AFTER EXPIRE) ================= */}
{resendConfirm && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[360px] h-[280px] p-6 rounded-3xl text-center">
      <p className="text-sm mb-8 pt-8">
        OTP expired.<br />
        Do you want to resend OTP to <br />
        <b>{maskEmail(ADMIN_EMAIL)}</b>?
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={sendOtp}
          className="px-5 py-2 bg-[#345261] text-white rounded-lg"
        >
          Resend OTP
        </button>
        <button
          onClick={() => setResendConfirm(false)}
          className="px-5 py-2 border rounded-lg
                     text-red-600 border-red-600
                     hover:bg-red-600 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      {/* ================= MAIN ================= */}
      <div className="min-h-screen flex items-center justify-center bg-[#345261]">
        <div className="bg-white w-[360px] p-8 rounded-xl shadow-xl">
          <h2 className="text-center font-semibold mb-4">
            {step === "login" && "LOG IN"}
            {step === "otp" && "VERIFY OTP"}
            {step === "reset" && "RESET PASSWORD"}
          </h2>

          {/* LOGIN */}
{step === "login" && (
  <>
    <input
      key="login-username"
      autoComplete="off"
      name="username_fake"
      className="w-full mb-3 px-3 py-2 bg-[#EFF6FF] rounded"
      placeholder="Username"
      value={form.username}
      onChange={(e) =>
        setForm({ ...form, username: e.target.value })
      }
    />

    <div className="relative mb-3">
      <input
        key="login-password"
        autoComplete="new-password"
        name="password_fake"
        type={showPassword ? "text" : "password"}
        className="w-full px-3 py-2 bg-[#EFF6FF] rounded"
        placeholder="Password"
        value={form.password}
        onChange={(e) =>
          setForm({ ...form, password: e.target.value })
        }
      />

      <span
        className="absolute right-3 top-2 cursor-pointer"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </span>
    </div>

    {isAdmin && (
      <div
        onClick={() => setShowConfirm(true)}
        className="text-xs text-right text-[#345261] cursor-pointer mb-4"
      >
        Forgot password?
      </div>
    )}

    <button
      onClick={handleLogin}
      disabled={loading}
      className="w-full py-2 bg-[#345261] text-white rounded"
    >
      {loading ? "Logging in..." : "Login"}
    </button>
  </>
)}

          {/* OTP */}
          {step === "otp" && (
            <>
              <p className="text-sm text-center mb-2">
                Enter OTP sent to your registered email
              </p>

              {otpTime > 0 ? (
                <p className="text-xs text-center text-gray-500 mb-2">
                  Expires in <b>{formatTime(otpTime)}</b>
                </p>
              ) : (
                <button
                  onClick={() => setResendConfirm(true)}
                  className="text-xs text-[#345261] underline block mx-auto mb-2"
                >
                  Resend OTP
                </button>
              )}

              <div className="flex justify-center gap-3 mb-4">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    className="w-10 h-10 text-center border rounded-lg text-lg"
                  />
                ))}
              </div>

              <button
                onClick={verifyOtp}
                className="w-full py-2 bg-[#345261] text-white rounded"
              >
                Verify OTP
              </button>
            </>
          )}

          {/* RESET */}
          {step === "reset" && (
            <>
             <p className="text-sm mb-8 pt-8">Please enter your new password and re-enter it to confirm.</p>
              <input
                type="password"
                placeholder="New Password"
                className="w-full mb-2 px-3 py-2 bg-[#EFF6FF] rounded"
                onChange={(e) => setNewPass(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full px-3 py-2 bg-[#EFF6FF] rounded"
                onChange={(e) => setConfirmPass(e.target.value)}
              />

              {passwordError && (
                <p className="text-red-600 text-xs mt-1 text-center">
                  {passwordError}
                </p>
              )}

              <button
                onClick={resetPassword}
                className="w-full mt-4 py-2 bg-[#345261] text-white rounded"
              >
                Update Password
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
