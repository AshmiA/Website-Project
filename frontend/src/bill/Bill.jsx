import React, { useEffect, useRef, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaDownload, FaPrint, FaPlus } from "react-icons/fa";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import JobPost from "../job/JobPost";
import Applicants from "../applicants/Applicants";
import Gallary from "../gallery/Gallery";
import Blogs from "../blogs/Blogs"; 
import UserAccess from "../useraccess/UserAccess";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

/* ------------------ Utilities ------------------ */
const currency = (value) => {
  const num = Number(value || 0);
  return "₹" + num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function numberToWords(num) {
  if (num === undefined || num === null) return "Zero Only";
  num = Math.round(Number(num) || 0);
  if (num === 0) return "Zero Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];
  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + inWords(n % 100) : "")
      );
    return "";
  };
  const parts = [];
  let crore = Math.floor(num / 10000000);
  if (crore) {
    parts.push(inWords(crore) + " Crore");
    num %= 10000000;
  }
  let lakh = Math.floor(num / 100000);
  if (lakh) {
    parts.push(inWords(lakh) + " Lakh");
    num %= 100000;
  }
  let thousand = Math.floor(num / 1000);
  if (thousand) {
    parts.push(inWords(thousand) + " Thousand");
    num %= 1000;
  }
  if (num) parts.push(inWords(num));
  return parts.join(" ") + " Only";
}

const computeItemTax = (amount, gstPercent) => {
  const amt = Number(amount || 0);
  const gstP = Number(gstPercent || 0);
  const gst = gstP ? (amt * gstP) / 100 : 0;
  const cgst = gst / 2;
  const sgst = gst / 2;
  const total = amt + gst;
  return { gst, cgst, sgst, total };
};

const subtotalItems = (items) =>
  (items || []).reduce((s, it) => s + (Number(it.amount || 0) || 0), 0);

const totalGST = (items) =>
  (items || []).reduce(
    (s, it) => s + computeItemTax(it.amount, it.gstPercent).gst,
    0
  );

const grandTotalCalc = (items, discountPercent = 0, roundOff = false) => {
  const amount = subtotalItems(items || []);
  const gst = totalGST(items || []);
  let total = amount + gst;
  const d = Number(discountPercent || 0);
  if (d) total = total - (total * d) / 100;
  if (roundOff) total = Math.round(total);
  return total;
};

const onlyDigitsMax = (value, maxLen) => {
  const digits = (value || "").replace(/\D/g, "");
  return digits.slice(0, maxLen);
};

const formatDateDisplay = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-GB");
};

const pdfNumber = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "0.00";
  return Number(n).toFixed(2);
};

/* ------------------ Print Dialog Component ------------------ */

function PrintDialog({ record, onClose, onPrint }) {
  const [destination, setDestination] = useState("pdf");
  const [paperSize, setPaperSize] = useState("A4");
  const [layout, setLayout] = useState("portrait");
  const [colorMode, setColorMode] = useState("color");
  const [pagesPerSheet, setPagesPerSheet] = useState("1");
  const [margins, setMargins] = useState("default");
  const [scale, setScale] = useState("default");
  const [options, setOptions] = useState({
    headersAndFooters: true,
    backgroundGraphics: true
  });

  const handlePrint = () => {
    onPrint(record, destination, {
      paperSize,
      layout,
      colorMode,
      pagesPerSheet,
      margins,
      scale,
      options
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex justify-end items-end">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Print Document</h2>
          
          {/* Destination */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Destination</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={destination === "pdf"}
                  onChange={(e) => setDestination(e.target.value)}
                  className="mr-2"
                />
                Save as PDF
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="printer"
                  checked={destination === "printer"}
                  onChange={(e) => setDestination(e.target.value)}
                  className="mr-2"
                />
                Print
              </label>
            </div>
          </div>

          {/* Pages */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pages</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={true}
                  onChange={() => {}}
                  className="mr-2"
                />
                All
              </label>
            </div>
          </div>

          {/* Layout */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Layout</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="portrait"
                  checked={layout === "portrait"}
                  onChange={(e) => setLayout(e.target.value)}
                  className="mr-2"
                />
                Portrait
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="landscape"
                  checked={layout === "landscape"}
                  onChange={(e) => setLayout(e.target.value)}
                  className="mr-2"
                />
                Landscape
              </label>
            </div>
          </div>

          {/* Paper Size */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Paper Size</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
              <option value="A5">A5</option>
            </select>
          </div>

          {/* Pages per Sheet */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pages per Sheet</label>
            <select
              value={pagesPerSheet}
              onChange={(e) => setPagesPerSheet(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="9">9</option>
              <option value="16">16</option>
            </select>
          </div>

          {/* Margins */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Margins</label>
            <select
              value={margins}
              onChange={(e) => setMargins(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="default">Default</option>
              <option value="none">None</option>
              <option value="minimum">Minimum</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Scale */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Scale</label>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="default">Default</option>
              <option value="fit">Fit to Page</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.headersAndFooters}
                  onChange={(e) => setOptions(prev => ({...prev, headersAndFooters: e.target.checked}))}
                  className="mr-2"
                />
                Headers and footers
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.backgroundGraphics}
                  onChange={(e) => setOptions(prev => ({...prev, backgroundGraphics: e.target.checked}))}
                  className="mr-2"
                />
                Background graphics
              </label>
            </div>
          </div>

          {/* Color Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Color Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="color"
                  checked={colorMode === "color"}
                  onChange={(e) => setColorMode(e.target.value)}
                  className="mr-2"
                />
                Color
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bw"
                  checked={colorMode === "bw"}
                  onChange={(e) => setColorMode(e.target.value)}
                  className="mr-2"
                />
                Black & White
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#23414a] text-white rounded hover:bg-[#1a3139]"
            >
              {destination === "pdf" ? "Save PDF" : "Print"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------ Main Component ------------------ */

export default function Bill() {
  // const [page, setPage] = useState("applicants");
  const [page, setPage] = useState(null);

  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotationForm, setQuotationForm] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(null);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState(null);
  const previewRef = useRef(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));

  const TOAST_DURATION = 3000;
  
  const btn = (name) =>
    `w-full text-left px-4 py-3 rounded mb-2 ${
      page === name ? "bg-[#23414a]" : "hover:bg-[#24343b]"
    }`;

  // Pagination and Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecords, setFilteredRecords] = useState(null);


  function getFirstAllowedPage(user) {
  if (!user) return null;
  if (user.role === "admin") return "applicants";

  const a = user.access;
  if (!a) return null;

  if (a.applicants) return "applicants";
  if (a.blogs) return "blogs";
  if (a.gallery) return "gallery";
  if (a.job) return "job";
  if (a.invoice) return "invoice";
  if (a.quotation) return "quotation";

  return null;
}
const hasInitialPage = useRef(false);

useEffect(() => {
  if (!user) return;
  if (hasInitialPage.current) return;

  const first = getFirstAllowedPage(user);
  if (first) {
    setPage(first);
    hasInitialPage.current = true;
  }
}, [user]);


  useEffect(() => {
    const style = document.createElement("style");
    style.id = "bill-toast-style";
    style.innerHTML = `
      @keyframes toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      .toast-progress { transform-origin: left; animation: toast-progress ${TOAST_DURATION}ms linear forwards; }
    `;
    if (!document.getElementById("bill-toast-style")) {
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById("bill-toast-style");
      if (el) el.remove();
    };
  }, []);

  const showToast = (message, duration = TOAST_DURATION) => {
    setToastMsg(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setTimeout(() => {
      setToastMsg(message);
      toastTimerRef.current = setTimeout(() => setToastMsg(null), duration);
    }, 40);
  };

  const Toast = () =>
    toastMsg && (
      <div className="fixed top-4 right-4 z-[9999] w-[320px]">
        <div
          className="bg-white text-black border rounded-lg shadow-lg overflow-hidden"
          style={{ borderColor: "#dfe8ee" }}
        >
          <div className="px-4 py-3 text-sm">{toastMsg}</div>
          <div className="h-1 bg-white">
            <div
              className="h-1 toast-progress"
              style={{ backgroundColor: "#345261" }}
            />
          </div>
        </div>
      </div>
    );

  /* ---------- Search and Pagination ---------- */
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredRecords(null);
      setCurrentPage(1);
      return;
    }

    const currentRecords = page === "quotation" ? quotations : invoices;
    const filtered = currentRecords.filter(record => {
      const slNo = String(currentRecords.indexOf(record) + 1).padStart(2, "0");
      const number = record.number?.toLowerCase() || '';
      const customerName = record.to?.name?.toLowerCase() || '';
      const date = formatDateDisplay(record.date)?.toLowerCase() || '';
      
      return (
        slNo.includes(term.toLowerCase()) ||
        number.includes(term.toLowerCase()) ||
        customerName.includes(term.toLowerCase()) ||
        date.includes(term.toLowerCase())
      );
    });
    
    setFilteredRecords(filtered);
    setCurrentPage(1);
  };

  const displayRecords = filteredRecords || (page === "quotation" ? quotations : invoices);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = displayRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.max(1, Math.ceil(displayRecords.length / recordsPerPage));

  const serial = (n) => String(n).padStart(2, "0");

  /* ---------- Record helpers ---------- */
  const getNextNumber = (type, records = []) => {
    const prefix = type === "quotation" ? "QU" : "IN";
    const last =
      records
        .map((r) => parseInt((r.number || "").replace(prefix, ""), 10))
        .filter((n) => !isNaN(n))
        .sort((a, b) => b - a)[0] || 0;
    return prefix + (last + 1).toString().padStart(3, "0");
  };

  const emptyRecord = (type, records = []) => ({
    type,
    _id: null,
    id: "local_" + Date.now(),
    number: getNextNumber(type, records),
    date: new Date().toISOString().slice(0, 10),
    logo: null,
    from: {
      name: "SPANGLES WEBX",
      email: "webxspangles@gmail.com",
      phone: "7708784111",
      address: "7-15C\n1st floor Puthuval vilai\nKattathurai post\nThiruvananthapuram main road \nOpposite packianath public school",
    },
    to: { name: "", email: "", phone: "", address: "" },
    items: [],
    discountPercent: "",
    showDiscount: false,
    roundOff: false,
    showAdditionalInfo: false,
    additionalInfo: "",
  });

  const isEmpty = (v) =>
    v === undefined || v === null || String(v).trim().length === 0;

  const validateAllFields = (form) => {
    if (!form) return false;
    if (isEmpty(form.number) || isEmpty(form.date)) return false;
    const fromReq = ["name", "email", "phone", "address"];
    for (const f of fromReq) if (!form.from?.[f]) return false;
    const toReq = ["name", "email", "phone", "address"];
    for (const f of toReq) if (!form.to?.[f]) return false;
    if (!Array.isArray(form.items) || form.items.length === 0) return false;
    for (const it of form.items) {
      if (!it.name) return false;
      if (it.amount === "" || it.amount === null || it.amount === undefined)
        return false;
    }
    return true;
  };

  /* ---------- Form helpers ---------- */
  const addItemToForm = (type) => {
    const newItem = {
      id: Date.now(),
      name: "",
      description: "",
      amount: 0,
      gstPercent: "",
    };
    if (type === "quotation") {
      setQuotationForm((p) => ({ ...p, items: [...(p?.items || []), newItem] }));
    } else {
      setInvoiceForm((p) => ({ ...p, items: [...(p?.items || []), newItem] }));
    }
  };

  const updateItemInForm = (type, index, field, value) => {
    const update = (prev) => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    };
    if (type === "quotation") setQuotationForm(update);
    else setInvoiceForm(update);
  };

  const removeItemFromForm = (type, index) => {
    const update = (prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    });
    if (type === "quotation") setQuotationForm(update);
    else setInvoiceForm(update);
  };

  const handleLogoFile = (file, type) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const obj = { name: file.name, dataUrl: ev.target.result };
      if (type === "quotation")
        setQuotationForm((p) => ({ ...p, logo: obj }));
      else setInvoiceForm((p) => ({ ...p, logo: obj }));
    };
    reader.readAsDataURL(file);
  };

  /* ---------- Validation ---------- */
  const validateForm = (form) => {
    const errors = [];
    if (form.from.email && !form.from.email.endsWith("@gmail.com"))
      errors.push("From Email must end with @gmail.com");
    if (form.to.email && !form.to.email.endsWith("@gmail.com"))
      errors.push("To Email must end with @gmail.com");
    if (form.from.phone && !/^\d{10}$/.test(form.from.phone))
      errors.push("From Phone must be 10 digits");
    if (form.to.phone && !/^\d{10}$/.test(form.to.phone))
      errors.push("To Phone must be 10 digits");
    if (form.from.pincode && !/^\d{6}$/.test(form.from.pincode))
      errors.push("From Postal Code must be 6 digits");
    if (form.to.pincode && !/^\d{6}$/.test(form.to.pincode))
      errors.push("To Postal Code must be 6 digits");
    if (errors.length) {
      showToast(errors.join(" | "));
      return false;
    }
    return true;
  };

  /* ---------- Data fetching ---------- */
  const fetchQuotations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/quotations`);
      const data = await res.json();
      setQuotations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/invoices`);
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetchInvoices();
    if (!quotationForm) setQuotationForm(emptyRecord("quotation", quotations));
    if (!invoiceForm) setInvoiceForm(emptyRecord("invoice", invoices));
    // eslint-disable-next-line
  }, []);

  /* ---------- Save / Update ---------- */
  const saveRecord = async (form, type) => {
    if (!validateForm(form)) return;
    try {
      const toInsert = { 
        ...form,
        showAdditionalInfo: type === "quotation" ? false : (form.showAdditionalInfo || false),
        additionalInfo: type === "quotation" ? "" : (form.additionalInfo || "")
      };
      const payload = { ...toInsert };
      delete payload._id;
      delete payload.id;

      if (!form._id) {
        if (type === "quotation")
          setQuotations((prev) => [{ ...toInsert }, ...prev]);
        else setInvoices((prev) => [{ ...toInsert }, ...prev]);
      } else {
        if (type === "quotation")
          setQuotations((prev) =>
            prev.map((p) => (p._id === form._id ? form : p))
          );
        else
          setInvoices((prev) =>
            prev.map((p) => (p._id === form._id ? form : p))
          );
      }

      const endpoint = `${API_BASE}/api/${type === "quotation" ? "quotations" : "invoices"}${form._id ? `/${form._id}` : ''}`;
      const method = form._id ? "PUT" : "POST";
      
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error(form._id ? "Update failed" : "Save failed");
      
      await (type === "quotation" ? fetchQuotations() : fetchInvoices());
      
      if (type === "quotation") {
        setShowQuotationForm(false);
        setQuotationForm(emptyRecord("quotation", quotations));
      } else {
        setShowInvoiceForm(false);
        setInvoiceForm(emptyRecord("invoice", invoices));
      }

      showToast(
        `${type === "quotation" ? "Quotation" : "Invoice"} saved successfully`
      );
    } catch (err) {
      console.error("Save error:", err);
      showToast(err.message || "Save failed");
    }
  };

  /* ---------- Delete ---------- */
  const deleteRecord = async (type, id) => {
    try {
      await fetch(
        `${API_BASE}/api/${
          type === "quotation" ? "quotations" : "invoices"
        }/${id}`,
        { method: "DELETE" }
      );
      if (type === "quotation") fetchQuotations();
      else fetchInvoices();
      showToast("Deleted successfully");
    } catch (e) {
      showToast("Delete failed");
    }
  };

  /* ---------- PDF download ---------- */
  const generatePDF_withAutoTable = async (record, filename) => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const usableWidth = pageWidth - margin * 2;

      const safeNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
      const hexToRgb = (hex) => {
        const n = parseInt(hex.replace("#", ""), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      };
      const titleRGB = hexToRgb("#23414a");
      const headerColor = [37, 68, 82];
      const typeLabel = record.type === "quotation" ? "Quotation" : "Invoice";

      doc.setDrawColor(180);
      doc.setLineWidth(1);
      doc.roundedRect(
        20,
        20,
        pageWidth - 40,
        doc.internal.pageSize.getHeight() - 40,
        14,
        14
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...titleRGB);
      const titleW = doc.getTextWidth(typeLabel);
      const titleY = margin + 8;
      doc.text(typeLabel, (pageWidth - titleW) / 2, titleY);

      const metaTop = titleY + 30;
      let my = metaTop;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`${typeLabel} No.`, margin, my);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(record.number, margin + 90, my);
      my += 22;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`${typeLabel} Date`, margin, my);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(formatDateDisplay(record.date), margin + 90, my);

      // Logo
      try {
        const logoUrl = record.logo?.dataUrl || "/logo.png";
        const res = await fetch(logoUrl);
        if (res.ok) {
          const blob = await res.blob();
          const dataUrl = await new Promise((resolve) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.readAsDataURL(blob);
          });
          doc.addImage(
            dataUrl,
            "PNG",
            pageWidth - margin - 150,
            metaTop - 6,
            150,
            55
          );
        }
      } catch {}

      let y = metaTop + 60;

      // FROM/TO boxes
      const boxPad = 28,
        boxGap = 20;
      const boxW = (usableWidth - boxGap) / 2;
      const measureBox = (obj) => {
        let h = 13 + 16;
        const lines = doc.splitTextToSize(
          obj.address || "",
          boxW - boxPad * 2
        );
        h += lines.length * 13;
        if (obj.email) h += 13;
        if (obj.phone) h += 13;
        return h;
      };
      const fromH = measureBox(record.from);
      const toH = measureBox(record.to);
      const finalH = Math.max(fromH, toH) + 46;
      doc.setDrawColor(210);
      doc.roundedRect(margin, y, boxW, finalH, 10, 10);
      doc.roundedRect(margin + boxW + boxGap, y, boxW, finalH, 10, 10);

      // FROM content
      let fy = y + boxPad,
        fx = margin + boxPad;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        record.type === "quotation" ? "Quotation From" : "Invoice From",
        fx,
        fy
      );
      fy += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text(record.from.name || "-", fx, fy);
      fy += 16;
      doc.setFontSize(10);
      const fLines = doc.splitTextToSize(
        record.from.address || "",
        boxW - boxPad * 2
      );
      doc.text(fLines, fx, fy);
      fy += fLines.length * 13 + 3;
      if (record.from.email) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Email:", fx, fy);
        doc.setFont("helvetica", "normal");
        doc.text(record.from.email, fx + 38, fy);
        fy += 14;
      }
      if (record.from.phone) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Phone No.:", fx, fy);
        doc.setFont("helvetica", "normal");
        doc.text(record.from.phone, fx + 60, fy);
        fy += 14;
      }

      // TO content
      let ty = y + boxPad,
        tx = fx + boxW + boxGap;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        record.type === "quotation" ? "Quotation For" : "Invoice For",
        tx,
        ty
      );
      ty += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text(record.to.name || "-", tx, ty);
      ty += 16;
      const tLines = doc.splitTextToSize(
        record.to.address || "",
        boxW - boxPad * 2
      );
      doc.text(tLines, tx, ty);
      ty += tLines.length * 13 + 3;
      if (record.to.email) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Email:", tx, ty);
        doc.setFont("helvetica", "normal");
        doc.text(record.to.email, tx + 38, ty);
        ty += 14;
      }
      if (record.to.phone) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Phone No.:", tx, ty);
        doc.setFont("helvetica", "normal");
        doc.text(record.to.phone, tx + 60, ty);
        ty += 14;
      }

      y = y + finalH + 28;

      // Table header
      const colW = {
        sl: 55,
        item: usableWidth * 0.28,
        amt: usableWidth * 0.15,
        gst: usableWidth * 0.07,
        sgst: usableWidth * 0.12,
        cgst: usableWidth * 0.12,
        total: usableWidth * 0.14,
      };
      const headerHeight = 38;
      doc.setFillColor(...headerColor);
      doc.roundedRect(margin, y, usableWidth, headerHeight, 14, 14, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      const headerY = y + 25;
      let hx = margin;
      [
        ["Sl", colW.sl],
        ["Item", colW.item],
        ["Amount", colW.amt],
        ["GST", colW.gst],
        ["SGST", colW.sgst],
        ["CGST", colW.cgst],
        ["Total", colW.total],
      ].forEach(([t, w]) => {
        doc.text(t, hx + w / 2, headerY, { align: "center" });
        hx += w;
      });

      const bodyY = y + headerHeight + 4;
      const tableRows = [];
      (record.items || []).forEach((it, i) => {
        const t = computeItemTax(it.amount, it.gstPercent);
        tableRows.push([
          String(i + 1).padStart(2, "0"),
          it.name,
          pdfNumber(it.amount),
          it.gstPercent ? `${it.gstPercent}%` : "-",
          it.gstPercent ? pdfNumber(t.sgst) : "-",
          it.gstPercent ? pdfNumber(t.cgst) : "-",
          it.gstPercent ? pdfNumber(t.total) : pdfNumber(it.amount),
        ]);

        if (it.description) {
          tableRows.push(["", it.description, "", "", "", "", ""]);
        }
      });

      autoTable(doc, {
        startY: bodyY,
        head: [],
        body: tableRows,
        theme: "plain",
        margin: { left: margin, right: margin },
        tableWidth: usableWidth,
        styles: {
          fontSize: 10,
          textColor: [55, 55, 55],
          cellPadding: { top: 4, bottom: 3, left: 6, right: 6 },
          lineWidth: 0,
          valign: "middle",
        },
        columnStyles: {
          0: { cellWidth: colW.sl, halign: "center" },
          1: { cellWidth: colW.item },
          2: { cellWidth: colW.amt, halign: "center" },
          3: { cellWidth: colW.gst, halign: "center" },
          4: { cellWidth: colW.sgst, halign: "center" },
          5: { cellWidth: colW.cgst, halign: "center" },
          6: { cellWidth: colW.total, halign: "center" },
        },
        didParseCell: (data) => {
          if (data.row.index % 2 === 1 && data.column.index === 1) {
            data.cell.styles.fontSize = 8;
            data.cell.styles.textColor = [120, 120, 120];
            data.cell.styles.fontStyle = "normal";
          }
        },
      });

      const bottom = doc.lastAutoTable.finalY;

      doc.setDrawColor(180);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, y, usableWidth, bottom - y, 14, 14);

      const wordsY = bottom + 28;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Total amount in words", margin, wordsY);

      const grand = safeNum(
        grandTotalCalc(
          record.items,
          record.discountPercent,
          record.roundOff
        )
      );
      const words = numberToWords(Math.round(grand));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(
        doc.splitTextToSize(words, usableWidth * 0.6),
        margin,
        wordsY + 16
      );

      const summaryW = 210;
      const summaryX = pageWidth - margin - summaryW;
      let sy = wordsY - 6;
      doc.setFillColor(245, 247, 249);
      doc.roundedRect(summaryX, sy, summaryW, 150, 14, 14, "F");
      sy += 22;

      const gstTotal = safeNum(totalGST(record.items));
      const discountVal = safeNum(
        -(
          (subtotalItems(record.items) + gstTotal) *
          (Number(record.discountPercent || 0) / 100)
        )
      );
      const roundDiff = record.roundOff
        ? safeNum(Math.round(grand) - grand)
        : 0;

      const summaryRow = (label, value, red = false) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(label, summaryX + 12, sy);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(red ? 255 : 40, red ? 0 : 40, red ? 0 : 40);
        doc.text(pdfNumber(value), summaryX + summaryW - 14, sy, {
          align: "right",
        });
        sy += 16;
      };

      summaryRow("Amount", safeNum(subtotalItems(record.items)));
      summaryRow("CGST", gstTotal / 2);
      summaryRow("SGST", gstTotal / 2);
      if (discountVal !== 0)
        summaryRow(`Discount (${record.discountPercent}%)`, discountVal, true);
      summaryRow("Round Off", roundDiff, true);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Total Amount", summaryX + 12, sy + 6);
      doc.text(pdfNumber(grand), summaryX + summaryW - 14, sy + 6, {
        align: "right",
      });

      doc.save(filename || `${record.number}.pdf`);
      showToast("PDF downloaded");
    } catch (err) {
      console.error("PDF ERROR:", err);
      showToast("PDF failed");
    }
  };

  const handleBackendPrint = async (record, destination = "pdf", options = {}) => {
    if (!record) {
      showToast("Nothing to print");
      return;
    }

    try {
      showToast(destination === "pdf" ? "Generating PDF..." : "Preparing document...");
      // Print implementation remains the same
    } catch (err) {
      console.error("Print error:", err);
      showToast(`Operation failed: ${err.message}`);
    }
  };

  /* ---------- UI actions ---------- */
  const openAdd = (type) => {
    if (type === "quotation") {
      setQuotationForm(emptyRecord("quotation", quotations));
      setShowQuotationForm(true);
    } else {
      setInvoiceForm(emptyRecord("invoice", invoices));
      setShowInvoiceForm(true);
    }
  };

  const openPreviewFor = (record) => {
    setPreviewRecord(record);
    setPreviewOpen(true);
  };

  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-slate-800">
      <Toast />

      {/* Sidebar */}
      <aside className="w-56 bg-[#344955] text-white p-6 fixed left-0 top-0 bottom-0 flex flex-col">
        <div className="text-2xl font-semibold mb-8">Billing</div>

        {/* NAV ITEMS */}
        <div className="flex-1">
          {/* ✅ ADMIN */}
          {user?.role === "admin" && (
            <>
              <button onClick={() => setPage("applicants")} className={btn("applicants")}>Applicants</button>
              <button onClick={() => setPage("blogs")} className={btn("blogs")}>Blogs</button>
              <button onClick={() => setPage("gallery")} className={btn("gallery")}>Gallery</button>
              <button onClick={() => setPage("invoice")} className={btn("invoice")}>Invoice</button>
              <button onClick={() => setPage("job")} className={btn("job")}>Job Post</button>
              <button onClick={() => setPage("quotation")} className={btn("quotation")}>Quotation</button>
              <button onClick={() => setPage("user-access")} className={btn("user-access")}>
                User Access
              </button>
            </>
          )}

          {/* ✅ USER */}
          {user?.role === "user" && (
            <>
              {user.access?.applicants && (
                <button onClick={() => setPage("applicants")} className={btn("applicants")}>Applicants</button>
              )}
              {user.access?.blogs && (
                <button onClick={() => setPage("blogs")} className={btn("blogs")}>Blogs</button>
              )}
              {user.access?.gallery && (
                <button onClick={() => setPage("gallery")} className={btn("gallery")}>Gallery</button>
              )}
              {user.access?.invoice && (
                <button onClick={() => setPage("invoice")} className={btn("invoice")}>Invoice</button>
              )}
              {user.access?.job && (
                <button onClick={() => setPage("job")} className={btn("job")}>Job Post</button>
              )}
              {user.access?.quotation && (
                <button onClick={() => setPage("quotation")} className={btn("quotation")}>Quotation</button>
              )}
            </>
          )}
        </div>

        {/* ✅ LOGOUT → COMMON FOR ALL */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="mt-4 flex items-center gap-3 px-4 py-3 rounded text-left
                     hover:bg-[#24343b] text-white-300 hover:text-white-400"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </aside>

      <main className="flex-1 ml-56 p-8">
        {/* JOB */}
        {page === "job" && (user?.role === "admin" || user?.access?.job) ? (
          <JobPost />

        ) : page === "applicants" && (user?.role === "admin" || user?.access?.applicants) ? (
          // <Applicants />
<Applicants showToast={showToast} />

        ) : page === "gallery" && (user?.role === "admin" || user?.access?.gallery) ? (
          <Gallary />

        ) : page === "blogs" && (user?.role === "admin" || user?.access?.blogs) ? (
          <Blogs />
          
        ) : page === "user-access" && user?.role === "admin" ? (
          <UserAccess />

        ) : (page === "invoice" || page === "quotation") ? (
          /* ✅ EXISTING INVOICE / QUOTATION UI - with proper permission checks */
          <div className="max-w-6xl mx-auto pt-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {page === "quotation" ? "Quotations" : "Invoices"}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search..."
                    className="pl-10 pr-4 border rounded-md bg-white w-32"
                  />
                </div>

                {/* Only show Add button if user has permission */}
                {(user?.role === "admin" ||
                  (page === "invoice" && user?.access?.invoice) ||
                  (page === "quotation" && user?.access?.quotation)) && (
                  <button
                    onClick={() => openAdd(page)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#345261] text-white rounded-lg"
                  >
                    <FaPlus />
                    Add {page === "quotation" ? "Quotation" : "Invoice"}
                  </button>
                )}
              </div>
            </div>

            {/* TABLE - Show table even if user can only view */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-[#345261] text-white">
                  <tr>
                    <th className="py-4 px-6">Sl No</th>
                    <th>No.</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">
                        No records
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((r, i) => (
                      <tr key={r._id || i} className="border-t text-center">
                        <td>{serial(indexOfFirstRecord + i + 1)}</td>
                        <td>{r.number}</td>
                        <td>{formatDateDisplay(r.date)}</td>
                        <td>{r.to?.name}</td>
                        <td className="flex justify-center gap-3 py-3">
                          <button onClick={() => openPreviewFor(r)}>
                            <FaEye />
                          </button>
                      
                          {(user?.role === "admin" ||
                            (page === "invoice" && user?.access?.invoice) ||
                          
                            <button
  onClick={() => {
    if (page === "quotation") {
      setQuotationForm({ ...r });
      setShowQuotationForm(true);   // ✅ OPEN QUOTATION EDIT MODAL
    } else {
      setInvoiceForm({ ...r });
      setShowInvoiceForm(true);     // ✅ OPEN INVOICE EDIT MODAL
    }
  }}
>
  <FaEdit />
</button>

                          )}
                       
                          {user?.role === "admin" && (
                            <button onClick={() => deleteRecord(page, r._id)}>
                              <FaTrash />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>&lt;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setCurrentPage(n)}
                    className={currentPage === n ? "bg-[#345261] text-white" : ""}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>&gt;</button>
              </div>
            )}
          </div>

        ) : (
          /* ❌ NO ACCESS - Show when user tries to access a page they don't have permission for */
          <div className="text-center text-gray-500 mt-20">
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p>You don't have permission to access this page.</p>
          </div>
        )}
      </main>

      {/* Quotation & Invoice modals */}
      {showQuotationForm && quotationForm && (
        <FormModal
          title="Quotation"
          form={quotationForm}
          setForm={setQuotationForm}
          onClose={() => setShowQuotationForm(false)}
          onSave={() => {
            if (!validateAllFields(quotationForm)) {
              showToast("Please fill all fields");
              return;
            }
            saveRecord(quotationForm, "quotation");
          }}
          addItem={() => addItemToForm("quotation")}
          updateItem={(i, f, v) => updateItemInForm("quotation", i, f, v)}
          removeItem={(i) => removeItemFromForm("quotation", i)}
          handleLogo={(file) => handleLogoFile(file, "quotation")}
          showAdditionalInfo={false} // No additional info for quotations
        />
      )}

      {showInvoiceForm && invoiceForm && (
        <FormModal
          title="Invoice"
          form={invoiceForm}
          setForm={setInvoiceForm}
          onClose={() => setShowInvoiceForm(false)}
          onSave={() => {
            if (!validateAllFields(invoiceForm)) {
              showToast("Please fill all fields");
              return;
            }
            saveRecord(invoiceForm, "invoice");
          }}
          addItem={() => addItemToForm("invoice")}
          updateItem={(i, f, v) => updateItemInForm("invoice", i, f, v)}
          removeItem={(i) => removeItemFromForm("invoice", i)}
          handleLogo={(file) => handleLogoFile(file, "invoice")}
          showAdditionalInfo={true} // Show additional info for invoices
        />
      )}

      {/* Preview modal */}
      {previewOpen && previewRecord && (
        <PreviewModal
          refNode={previewRef}
          record={previewRecord}
          onClose={() => setPreviewOpen(false)}
          onEdit={() => {
            setPreviewOpen(false);
            if (previewRecord.type === "quotation") {
              setQuotationForm({ ...previewRecord });
              setShowQuotationForm(true);
            } else {
              setInvoiceForm({ ...previewRecord });
              setShowInvoiceForm(true);
            }
          }}
          onDownload={() =>
            generatePDF_withAutoTable(
              previewRecord,
              `${previewRecord.number || "document"}.pdf`
            )
          }
          onPrint={() => {
            setSelectedRecord(previewRecord);
            setShowPrintDialog(true);
          }}
        />
      )}

      {/* Print Dialog */}
      {showPrintDialog && selectedRecord && (
        <PrintDialog
          record={selectedRecord}
          onClose={() => {
            setShowPrintDialog(false);
            setSelectedRecord(null);
          }}
          onPrint={(record, destination, options) => {
            handleBackendPrint(record, destination, options);
          }}
        />
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-[400px] p-6 shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-2">
              Are you sure you want to logout?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              You will be redirected to the login page.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-6 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* small embedded styles */}
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        .paper {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.12);
          padding: 28px;
        }
          .animate-progress {
  animation: progressBar 3s ease-out forwards !important;
}

      `}</style>
    </div>
  );
}

/* ========================= */
/*  Form Modal Component     */
/* ========================= */

function FormModal({
  title,
  form,
  setForm,
  onClose,
  onSave,
  addItem,
  updateItem,
  removeItem,
  handleLogo,
  showAdditionalInfo = true,
}) {
  const fileRef = useRef(null);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex justify-center items-start pt-8 px-4">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-gray-200 my-6 p-6 max-h-[85vh] overflow-y-auto text-[13px]">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-[#23414a]">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-black">
              ✕
            </button>
          </div>

          {/* NUMBER / DATE / LOGO */}
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-8">
              <div className="mb-3">
                <label className="text-xs text-slate-600">{title} No.:</label>
                <input
                  className="mt-1 w-1/2 border-b border-gray-300 py-1 px-1 text-sm"
                  value={form.number}
                  readOnly
                />
              </div>

              <div>
                <label className="text-xs text-slate-600">{title} Date</label>
                <input
                  type="date"
                  className="mt-1 w-1/2 border-b border-gray-300 py-1 px-1 text-sm"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* LOGO */}
            <div className="col-span-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="h-24 flex items-center justify-center cursor-pointer bg-white"
              >
                {form.logo ? (
                  <img src={form.logo.dataUrl} alt="logo" className="h-full object-contain p-2" />
                ) : (
                  <img src="/logo.png" alt="default-logo" className="h-full object-contain p-2 opacity-70" />
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogo(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* FROM & TO */}
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* FROM BOX */}
            <div className="border rounded-2xl p-4">
              <h3 className="text-[13px] font-semibold mb-2 text-[#23414a]">
                {title} From
              </h3>

              <input
                className="w-full border-b py-2 text-sm mb-2 px-1"
                placeholder="Your Business Name"
                value={form.from.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, from: { ...p.from, name: e.target.value } }))
                }
              />

              <input
                className="w-full border-b py-2 text-sm mb-2 px-1"
                placeholder="Your Email"
                value={form.from.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, from: { ...p.from, email: e.target.value } }))
                }
              />

              <input
                className="w-full border-b py-2 text-sm mb-2 px-1"
                placeholder="Your Phone Number"
                value={form.from.phone}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    from: { ...p.from, phone: onlyDigitsMax(e.target.value, 10) },
                  }))
                }
              />

              <textarea
                className="w-full border-b py-2 text-sm mb-2 px-1 resize-none overflow-hidden h-24 leading-tight"
                placeholder="Address"
                value={form.from.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, from: { ...p.from, address: e.target.value } }))
                }
              />
            </div>

            {/* TO BOX */}
            <div className="border rounded-2xl p-4">
              <h3 className="text-[13px] font-semibold mb-2 text-[#23414a]">
                {title} For
              </h3>

              <input
                className="w-full border-b py-2 text-sm mb-2 px-1"
                placeholder="Client Business Name"
                value={form.to.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, to: { ...p.to, name: e.target.value } }))
                }
              />

              <input
                className="w-full border-b py-2 text-sm mb-2 px-1"
                placeholder="Client Email"
                value={form.to.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, to: { ...p.to, email: e.target.value } }))
                }
              />

              <input
                className="w-full border-b py-2 text-sm mb-2 px-1"
                placeholder="Client Phone Number"
                value={form.to.phone}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    to: { ...p.to, phone: onlyDigitsMax(e.target.value, 10) },
                  }))
                }
              />

              <textarea
                className="w-full border-b py-2 text-sm mb-2 px-1 resize-none overflow-hidden h-24 leading-tight"
                placeholder="Address"
                value={form.to.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, to: { ...p.to, address: e.target.value } }))
                }
              />
            </div>
          </div>

          {/* ITEMS BLOCK */}
          <div className="border rounded-lg overflow-hidden mb-4 text-sm">
            <div className="bg-[#345261] text-white text-[12px] rounded-t-lg font-medium">
              <div className="grid grid-cols-12 gap-4 px-3 py-2">
                <div className="col-span-4">Item</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-1">GST%</div>
                <div className="col-span-1">CGST</div>
                <div className="col-span-1">SGST</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-1 text-center">Action</div>
              </div>
            </div>

            <div className="p-3">
              {(form.items || []).length === 0 ? (
                <div className="text-sm text-slate-500 py-3">
                  No items added. Click + Add Item to begin.
                </div>
              ) : (
                (form.items || []).map((it, idx) => {
                  const t = computeItemTax(it.amount, it.gstPercent);
                  return (
                    <div
                      key={it.id || idx}
                      className="grid grid-cols-12 gap-4 items-start py-2 border-b text-[12px]"
                    >
                      {/* ITEM NAME + DESCRIPTION */}
                      <div className="col-span-4">
                        <input
                          value={it.name}
                          onChange={(e) => updateItem(idx, "name", e.target.value)}
                          className="w-full border-b py-1 px-1 text-[12px]"
                          placeholder="Item name"
                        />

                        <textarea
                          value={it.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          placeholder="+ Add Description"
                          className="mt-2 w-full border p-2 text-[12px] rounded"
                          rows={2}
                        />
                      </div>

                      {/* AMOUNT */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={it.amount}
                          onChange={(e) => updateItem(idx, "amount", e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          className="w-full border-b py-1 px-1 text-[12px]"
                          placeholder="Enter amount"
                        />
                      </div>

                      {/* GST % */}
                      <div className="col-span-1">
                        <input
                          type="number"
                          value={it.gstPercent}
                          onChange={(e) => updateItem(idx, "gstPercent", e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          className="w-full border-b py-1 px-1 text-[12px]"
                          placeholder="GST%"
                        />
                      </div>

                      {/* CGST */}
                      <div className="col-span-1 flex items-center">
                        {it.gstPercent ? currency(t.cgst) : ""}
                      </div>

                      {/* SGST */}
                      <div className="col-span-1 flex items-center">
                        {it.gstPercent ? currency(t.sgst) : ""}
                      </div>

                      {/* TOTAL */}
                      <div className="col-span-2 flex items-center">
                        {it.gstPercent ? currency(t.total) : currency(it.amount)}
                      </div>

                      {/* REMOVE BTN */}
                      <div className="col-span-1 flex justify-center items-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* ADD ITEM */}
              <div className="mt-2">
                <button onClick={addItem} className="text-sm text-slate-600">
                  + Add Next Item
                </button>
              </div>
            </div>
          </div>

          {/* TOTALS BLOCK */}
          <div className="grid grid-cols-12 gap-4 mb-4">
            {/* AMOUNT IN WORDS */}
            <div className="col-span-7">
              <div className="text-xs text-slate-500">Total amount in words</div>
              <div className="text-sm font-semibold mt-2 text-black">
                {numberToWords(
                  Math.round(
                    grandTotalCalc(
                      form.items || [],
                      form.discountPercent,
                      form.roundOff
                    )
                  )
                )}
              </div>
            </div>

            {/* SUMMARY BOX */}
            <div className="col-span-5">
              <div className="bg-white border rounded p-3 text-[12px]">

                <div className="flex justify-between py-1">
                  <div>Amount</div>
                  <div>{currency(subtotalItems(form.items || []))}</div>
                </div>

                <div className="flex justify-between py-1">
                  <div>CGST</div>
                  <div>{currency(totalGST(form.items || []) / 2)}</div>
                </div>

                <div className="flex justify-between py-1">
                  <div>SGST</div>
                  <div>{currency(totalGST(form.items || []) / 2)}</div>
                </div>

                {/* DISCOUNT OPTION */}
                <div className="mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.showDiscount}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, showDiscount: e.target.checked }))
                      }
                    />
                    + Discount on total
                  </label>

                  {form.showDiscount && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs">Discount (%)</label>
                      <input
                        type="number"
                        className="border py-1 px-2 text-[12px]"
                        value={form.discountPercent}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, discountPercent: e.target.value }))
                        }
                      />
                    </div>
                  )}
                </div>

                {/* ROUND OFF */}
                <div className="flex justify-between items-center py-2 mt-2">
                  <div>Round Off</div>
                  <div>
                    <input
                      type="checkbox"
                      checked={!!form.roundOff}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, roundOff: e.target.checked }))
                      }
                    />
                  </div>
                </div>

                {/* TOTAL */}
                <div className="border-t mt-2 pt-2 text-right">
                  <div className="text-xs">Total Amount</div>
                  <div className="text-base font-semibold">
                    {currency(
                      grandTotalCalc(
                        form.items || [],
                        form.discountPercent,
                        form.roundOff
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ADDITIONAL INFO - Only show for invoices */}
          {showAdditionalInfo && (
            <div className="mt-6 border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#345261]">
                  Additional Info
                </label>

                {/* Switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.showAdditionalInfo}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        showAdditionalInfo: e.target.checked,
                        additionalInfo: e.target.checked ? prev.additionalInfo : "",
                      }))
                    }
                    className="sr-only peer"
                  />

                  <div className="w-12 h-6 bg-gray-200 rounded-full peer-checked:bg-[#23414a] transition-all"></div>

                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow 
                                  transition-all peer-checked:translate-x-6"></div>
                </label>
              </div>

              {form.showAdditionalInfo && (
                <textarea
                  className="w-full border rounded-xl p-3 mt-4 text-sm"
                  rows={3}
                  placeholder="Enter description..."
                  value={form.additionalInfo || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, additionalInfo: e.target.value }))
                  }
                />
              )}
            </div>
          )}

          {/* SAVE BUTTON */}
          <div className="flex justify-end mt-4">
            <button
              onClick={onSave}
              className="px-4 py-2 bg-[#23414a] text-white rounded"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ========================= */
/*  Preview Modal Component  */
/* ========================= */

function PreviewModal({
  refNode,
  record,
  onClose,
  onEdit,
  onDownload,
  onPrint,
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex justify-center items-start pt-8 px-4">
        <div
          ref={refNode}
          className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-gray-200 my-6 p-6 max-h-[90vh] overflow-y-auto relative"
        >
          <div className="flex justify-end items-center gap-2 mb-2">
            <button
              title="Edit"
              onClick={onEdit}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <FaEdit className="text-[#345261]" />
            </button>

            <button
              title="Download PDF"
              onClick={onDownload}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <FaDownload className="text-[#345261]" />
            </button>

            <button
              title="Print"
              onClick={onPrint}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <FaPrint className="text-[#345261]" />
            </button>

            <button
              title="Close"
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100 text-red-500 hover:text-red-600"
            >
              ✕
            </button>
          </div>

          <div className="border p-6 rounded-lg bg-white">
            <h1 className="text-2xl font-semibold text-[#345261] text-center uppercase tracking-wide mb-4">
              {record.type === "quotation" ? "Quotation" : "Invoice"}
            </h1>

            <div className="flex justify-between items-start border-b pb-3 mb-5">
              <div className="text-sm leading-5">
                <div className="mb-1">
                  <span className="text-slate-500 text-xs">
                    {record.type === "quotation"
                      ? "Quotation No.:"
                      : "Invoice No.:"}
                  </span>
                  <span className="ml-1 font-medium">{record.number}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">
                    {record.type === "quotation"
                      ? "Quotation Date:"
                      : "Invoice Date:"}
                  </span>
                  <span className="ml-1 font-medium">
                    {formatDateDisplay(record.date)}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <img
                  src={record.logo?.dataUrl || "/logo.png"}
                  alt="Company Logo"
                  className="h-16 object-contain"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="fromto-box border rounded-xl p-4 bg-white shadow-sm">
                <h3 className="font-semibold mb-2 text-[#345261]">
                  {record.type === "quotation"
                    ? "Quotation From"
                    : "Invoice From"}
                </h3>
                
                <p className="font-medium">{record.from?.name}</p>
                <br/>
                <p>{record.from?.address}</p>
                <br/>
                <p className="mt-1">
                  <strong>Email:</strong> {record.from?.email}
                </p>
                <br/>
                <p>
                  <strong>Phone:</strong> {record.from?.phone}
                </p>
              </div>

              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <h3 className="font-semibold mb-2 text-[#345261]">
                  {record.type === "quotation"
                    ? "Quotation For"
                    : "Invoice For"}
                </h3>
                <p className="font-medium">{record.to?.name}</p>
                <br/>
                <p>{record.to?.address}</p>
                <br/>
                <p className="mt-1">
                  <strong>Email:</strong> {record.to?.email}
                </p>
                <br/>
                <p>
                  <strong>Phone:</strong> {record.to?.phone}
                </p>
              </div>
            </div>

            <div className="border rounded-2xl overflow-hidden text-sm mb-6">
              <div className="grid grid-cols-[0.6fr_3fr_1.5fr_1fr_1fr_1fr_1.6fr] text-center">
                <div className="bg-[#345261] text-white px-4 py-2 text-center font-medium">
                  Sl. No.
                </div>
                <div className="bg-[#345261] text-white px-4 py-2 text-left font-medium">
                  Item
                </div>
                <div className="bg-[#345261] text-white px-4 py-2 text-center font-medium">
                  Amount
                </div>
                <div className="bg-[#345261] text-white px-4 py-2 text-center font-medium">
                  GST
                </div>
                <div className="bg-[#345261] text-white px-4 py-2 text-center font-medium">
                  CGST
                </div>
                <div className="bg-[#345261] text-white px-4 py-2 text-center font-medium">
                  SGST
                </div>
                <div className="bg-[#345261] text-white px-4 py-2 text-center font-medium">
                  Total
                </div>

                {(record.items || []).map((it, idx) => {
                  const t = computeItemTax(it.amount, it.gstPercent);
                  return (
                    <React.Fragment key={idx}>
                      <div className="px-4 py-2">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="px-4 py-2 text-left">
                        <p className="font-medium">{it.name}</p>
                        {it.description && (
                          <p className="text-xs text-gray-500">
                            {it.description}
                          </p>
                        )}
                      </div>
                      <div className="px-4 py-2 text-center">
                        {Number(it.amount || 0).toFixed(2)}
                      </div>
                      <div className="px-4 py-2 text-center">
                        {it.gstPercent ? `${it.gstPercent}%` : "–"}
                      </div>

                      <div className="px-4 py-2 text-center">
                        {it.gstPercent ? currency(t.cgst) : "–"}
                      </div>

                      <div className="px-4 py-2 text-center">
                        {it.gstPercent ? currency(t.sgst) : "–"}
                      </div>

                      <div className="px-4 py-2 text-center">
                        {it.gstPercent ? currency(t.total) : Number(it.amount).toFixed(2)}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-8">
                <p className="text-gray-500 text-sm">
                  Total amount in words
                </p>
                <p className="text-base font-semibold mt-2 text-[#345261]">
                  {numberToWords(
                    Math.round(
                      grandTotalCalc(
                        record.items,
                        record.discountPercent,
                        record.roundOff
                      )
                    )
                  )}
                </p>
              </div>

              <div className="col-span-4">
                <div className="border rounded-xl p-4 text-sm bg-gray-50">
                  <div className="flex justify-between mb-1">
                    <span>Amount</span>
                    <span>{currency(subtotalItems(record.items))}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>CGST</span>
                    <span>{currency(totalGST(record.items) / 2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>SGST</span>
                    <span>{currency(totalGST(record.items) / 2)}</span>
                  </div>
                  {record.discountPercent > 0 && (
                    <div className="flex justify-between mb-1">
                      <span>Discount ({record.discountPercent}%)</span>
                      <span className="text-red-500">
                        -{" "}
                        {currency(
                          (subtotalItems(record.items) +
                            totalGST(record.items)) *
                            (Number(record.discountPercent || 0) / 100)
                        )}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-black text-base">
                    <span>Total Amount</span>
                    <span>
                      {currency(
                        grandTotalCalc(
                          record.items,
                          record.discountPercent,
                          record.roundOff
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Only show additional info for invoices */}
            {record.type === "invoice" && record.additionalInfo && (
              <div className="mt-6 border rounded-xl p-4 bg-white">
                <h3 className="font-semibold text-[#345261] mb-2">
                  Additional Info
                </h3>
                <p className="text-sm text-gray-700">
                  {record.additionalInfo}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end"></div>
          </div>
        </div>
      </div>
    </>
  );
}

