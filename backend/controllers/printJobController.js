import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import printer from "pdf-to-printer";

const TEMP_PDF = path.join(process.cwd(), "temp-print.pdf");
const DEFAULT_CSS_PATH = path.join(process.cwd(), "public", "preview.css");

/* ------------------------------------------------------------------
  HELPERS
------------------------------------------------------------------ */
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("en-GB");
}

function numberToWords(n) {
  if (isNaN(n) || n == null) return "";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function two(n) {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
  }

  function three(n) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (h ? a[h] + " Hundred" + (r ? " " : "") : "") + (r ? two(r) : "");
  }

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const words = [];
  if (crore) words.push(three(crore) + " Crore");
  if (lakh) words.push(three(lakh) + " Lakh");
  if (thousand) words.push(three(thousand) + " Thousand");
  if (n) words.push(three(n));

  return words.join(" ") + " Only";
}

function loadBase64(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).replace(".", "") || "png";
    return `data:image/${ext};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------
  BUILD HTML FUNCTION - WITH ADDITIONAL INFO AFTER SUMMARY
------------------------------------------------------------------ */
function buildHtml(record, colorMode = "color") {
  let cssExternal = "";
  try {
    if (fs.existsSync(DEFAULT_CSS_PATH))
      cssExternal = fs.readFileSync(DEFAULT_CSS_PATH, "utf8");
  } catch {}

  /* LOGO */
  let logoSrc = "";
  if (record.logo?.dataUrl) logoSrc = record.logo.dataUrl;
  else if (record.logo) logoSrc = loadBase64(path.resolve(record.logo));

  if (!logoSrc) {
    const fallback = path.join(process.cwd(), "uploads", "logo.png");
    logoSrc = loadBase64(fallback);
  }
  if (!logoSrc) logoSrc = "/logo.png";

  const logoStyle = colorMode === "bw" ? "filter: grayscale(100%);" : "";

  /* Helpers */
  function renderRow(it, globalIndex) {
    const amt = Number(it.amount || 0);
    const gst = Number(it.gstPercent || 0);
    const gstAmt = (amt * gst) / 100;

    return `
      <tr>
        <td style="text-align:center">${String(globalIndex + 1).padStart(2,"0")}</td>
        <td>
          <div style="font-weight:600">${escapeHtml(it.name || "")}</div>
          ${
            it.description
              ? `<div style="font-size:11px;color:#777;margin-top:3px">${escapeHtml(
                  it.description
                )}</div>`
              : ""
          }
        </td>
        <td style="text-align:center">₹${amt.toFixed(2)}</td>
        <td style="text-align:center">${gst}%</td>
        <td style="text-align:center">₹${(gstAmt / 2).toFixed(2)}</td>
        <td style="text-align:center">₹${(gstAmt / 2).toFixed(2)}</td>
        <td style="text-align:center">₹${(amt + gstAmt).toFixed(2)}</td>
      </tr>
    `;
  }

  /* Pagination */
  const ROWS_PER_PAGE = 12;
  const items = record.items || [];
  const pages = [];
  for (let i = 0; i < items.length; i += ROWS_PER_PAGE)
    pages.push(items.slice(i, i + ROWS_PER_PAGE));
  if (pages.length === 0) pages.push([]);

  /* Totals */
  const subtotal = items.reduce((s, it) => s + Number(it.amount || 0), 0);
  const totalGST = items.reduce(
    (s, it) =>
      s + (Number(it.amount || 0) * Number(it.gstPercent || 0)) / 100,
    0
  );

  const discountPercent = Number(record.discountPercent || 0);
  const discountAmount = ((subtotal + totalGST) * discountPercent) / 100;
  const finalTotal = subtotal + totalGST - discountAmount;

  const amountInWords = numberToWords(Math.round(finalTotal));

  const headerColor = colorMode === "bw" ? "#e6e6e6" : "#345261";
  const labelColor = colorMode === "bw" ? "#000" : "#fff";

  /* Check if additional info should be shown */
  const showAdditionalInfo = record.showAdditionalInfo === true && 
                            record.additionalInfo && 
                            record.additionalInfo.trim() !== '';

  console.log('=== BUILD HTML DEBUG ===');
  console.log('Record showAdditionalInfo:', record.showAdditionalInfo);
  console.log('Record additionalInfo:', record.additionalInfo);
  console.log('Show Additional Info Flag:', showAdditionalInfo);
  console.log('=== END DEBUG ===');

  /* HTML */
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
${cssExternal}

body {
  font-family: 'Poppins', sans-serif !important;
  font-size: 14px;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  margin: 0;
  padding: 0;
}

.table-header {
  background: #345261 !important;
}

.table-header th {
  background: #345261 !important;
  border: none !important;
  outline: none !important;
  border-radius: 0 !important;
}

.table-box thead {
  background: #345261 !important;
}

.table-box th::before,
.table-box th::after {
  display: none !important;
}

/* Page */
.page {
  position: relative;
  width: 794px;
  min-height: 1122px;
  padding: 50px 40px 60px;
  background: #fff;
  page-break-after: always;
}
.page .page-border {
  position:absolute; inset:0; border:3px solid #e6e8ec !important; z-index:2;
}

.content { position: relative; z-index: 3; }

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: none !important;
}

.title {
  text-align:center;
  margin-bottom:20px;
  color:${headerColor};
}

.address-section {
  display:flex;
  gap:20px;
  margin-bottom:30px;
}

.address-box {
  flex:1;
  border:1px solid #ddd;
  background:#fff;
  border-radius:8px;
  padding:15px;
}

.address-box h3 {
  margin: 0 0 12px 0;
  color: ${headerColor};
  font-size: 16px;
  padding-bottom: 8px;
}

/* Table */
.table-box {
  margin-top:35px;
  border-radius:12px;
  border:1px solid #ddd;
  overflow:hidden;
  background:#fff;
}

.table-box table {
  width:100%;
  border-collapse:separate !important;
  border-spacing:0 !important;
}

.table-box th,
.table-box td {
  border:none !important;
  box-shadow:none !important;
}

/* Table Header */
.table-header th {
  background:${headerColor} !important;
  color:${labelColor} !important;
  padding:15px 8px;
  font-size:13px;
  font-weight:700;
  text-align:center;
  border: none !important;
  border-right: none !important;
  border-left: none !important;
}

.table-box {
  border-radius: 12px;
  overflow: hidden;
}

/* Body */
.table-box tbody td {
  padding:12px 8px;
  color:#222;
  font-size:13px;
  border-bottom: 1px solid #f0f0f0;
}

/* Alignment */
.table-box td:nth-child(1) { text-align:center; width:8%; }
.table-box td:nth-child(2) { text-align:left; width:32%; }
.table-box td:nth-child(3),
.table-box td:nth-child(4),
.table-box td:nth-child(5),
.table-box td:nth-child(6),
.table-box td:nth-child(7) {
  text-align:center;
}

/* Summary Section */
.summary-section {
  display:flex;
  justify-content:space-between;
  padding-top:25px;
  margin-top:30px;
  gap: 30px;
}

.amount-words {
  flex: 2;
  padding-right: 20px;
}

.amount-words strong {
  font-size: 13px;
  color: #666;
  display: block;
  margin-bottom: 8px;
}

.amount-words .words {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.amount-breakdown {
  flex: 1;
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
}

.amount-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.amount-row.total {
  font-weight: bold;
  font-size: 16px;
  color: #345261;
  padding-top: 12px;
  margin-top: 8px;
}

.discount {
  color: #e74c3c;
}

/* Additional Info Section */
.additional-info-section {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9fafb;
  page-break-inside: avoid;
}

.additional-info-section h3 {
  margin: 0 0 12px 0;
  color: ${headerColor};
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.additional-info-content {
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  white-space: pre-line;
}

/* Continuation pages */
.continuation .header {
  display: none;
}

.continuation .address-section {
  display: none;
}

</style>
</head>
<body>
`;

  /* FIRST PAGE */
  const first = pages[0];

  html += `
<div class="page">
<div class="page-border"></div>
<div class="content">

<div class="title"><h1>${record.type === "quotation" ? "QUOTATION" : "INVOICE"}</h1></div>

<div class="header">
  <div>
    <div><strong>${record.type === "quotation" ? "Quotation No:" : "Invoice No:"}</strong> ${escapeHtml(record.number)}</div>
    <br/>
    <div><strong>Date:</strong> ${fmtDate(record.date)}</div>
  </div>
  <img src="${logoSrc}" class="logo" style="max-width:150px;max-height:80px;${logoStyle}" />
</div>

<div class="address-section">
  <div class="address-box">
    <h3>${record.type === "quotation" ? "Quotation From" : "Invoice From"}</h3>
    <strong>${escapeHtml(record.from?.name || "")}</strong><br><br>
    ${escapeHtml(record.from?.address || "").replace(/\n/g,"<br>")}<br><br>
    <strong>Email:</strong> ${escapeHtml(record.from?.email || "")}<br><br>
    <strong>Phone:</strong> ${escapeHtml(record.from?.phone || "")}
  </div>

  <div class="address-box">
    <h3>${record.type === "quotation" ? "Quotation For" : "Invoice For"}</h3>
    <strong>${escapeHtml(record.to?.name || "")}</strong><br><br>
    ${escapeHtml(record.to?.address || "").replace(/\n/g,"<br>")}<br><br>
    <strong>Email:</strong> ${escapeHtml(record.to?.email || "")}<br><br>
    <strong>Phone:</strong> ${escapeHtml(record.to?.phone || "")}
  </div>
</div>

<div class="table-box">
<table>
<thead>
  <tr class="table-header">
    <th>Sl. No.</th>
    <th>Item</th>
    <th>Amount</th>
    <th>GST</th>
    <th>CGST</th>
    <th>SGST</th>
    <th>Total</th>
  </tr>
</thead>
<tbody>
`;

  first.forEach((it, idx) => {
    html += renderRow(it, idx);
  });

  html += `
</tbody>
</table>
</div>
`;

  /* SUMMARY IF SINGLE PAGE */
  if (pages.length === 1) {
    html += `
<div class="summary-section">
  <div class="amount-words">
    <strong>Total amount in words</strong>
    <div class="words">${escapeHtml(amountInWords)}</div>
  </div>
  <div class="amount-breakdown">
    <div class="amount-row">
      <span>Amount:</span>
      <span>₹${subtotal.toFixed(2)}</span>
    </div>
    <div class="amount-row">
      <span>CGST:</span>
      <span>₹${(totalGST / 2).toFixed(2)}</span>
    </div>
    <div class="amount-row">
      <span>SGST:</span>
      <span>₹${(totalGST / 2).toFixed(2)}</span>
    </div>
    ${
      discountPercent
        ? `<div class="amount-row discount">
            <span>Discount (${discountPercent}%):</span>
            <span>-₹${discountAmount.toFixed(2)}</span>
          </div>`
        : ""
    }
    <div class="amount-row total">
      <span>Total:</span>
      <span>₹${finalTotal.toFixed(2)}</span>
    </div>
  </div>
</div>`;

    /* ADDITIONAL INFO SECTION - For single page documents AFTER summary */
    if (showAdditionalInfo) {
      html += `
<div class="additional-info-section">
  <h3>Additional Information</h3>
  <div class="additional-info-content">
    ${escapeHtml(record.additionalInfo).replace(/\n/g, "<br>")}
  </div>
</div>
`;
    }
  }

  html += `</div></div>`;

  /* OTHER PAGES */
  for (let p = 1; p < pages.length; p++) {
    const chunk = pages[p];
    const start = p * ROWS_PER_PAGE;

    html += `
<div class="page continuation">
<div class="page-border"></div>
<div class="content">

<div class="table-box">
<table>
<thead>
  <tr class="table-header">
    <th>Sl. No.</th>
    <th>Item</th>
    <th>Amount</th>
    <th>GST</th>
    <th>CGST</th>
    <th>SGST</th>
    <th>Total</th>
  </tr>
</thead>
<tbody>
`;

    chunk.forEach((it, idx) => {
      html += renderRow(it, start + idx);
    });

    html += `
</tbody>
</table>
</div>`;

    if (p === pages.length - 1) {
      html += `
<div class="summary-section">
  <div class="amount-words">
   <div> Total amount in words</div>
   <br/>
    <strong><div class="words">${escapeHtml(amountInWords)}</div></strong>
  </div>
  <div class="amount-breakdown">
  <br/>
    <div class="amount-row">
      <span>Amount:</span>
      <span>₹${subtotal.toFixed(2)}</span>
    </div>
    <div class="amount-row">
      <span>CGST:</span>
      <span>₹${(totalGST / 2).toFixed(2)}</span>
    </div>
    <div class="amount-row">
      <span>SGST:</span>
      <span>₹${(totalGST / 2).toFixed(2)}</span>
    </div>
    ${
      discountPercent
        ? `<div class="amount-row discount">
            <span>Discount (${discountPercent}%):</span>
            <span>-₹${discountAmount.toFixed(2)}</span>
          </div>`
        : ""
    }
    <div class="amount-row total">
      <span>Total:</span>
      <span>₹${finalTotal.toFixed(2)}</span>
    </div>
  </div>
</div>`;

      /* ADDITIONAL INFO SECTION - For multi-page documents AFTER summary on LAST page */
      if (showAdditionalInfo) {
        html += `
<div class="additional-info-section">
  <h3>Additional Information</h3>
  <div class="additional-info-content">
    ${escapeHtml(record.additionalInfo).replace(/\n/g, "<br>")}
  </div>
</div>
`;
      }
    }

    html += `</div></div>`;
  }

  html += `</body></html>`;
  return html;
}

/* ------------------------------------------------------------------
  GET AVAILABLE PRINTERS
------------------------------------------------------------------ */
export const getPrinters = async (req, res) => {
  try {
    console.log('Fetching available printers...');
    const printers = await printer.getPrinters();
    console.log('Available printers:', printers.map(p => p.name));
    
    res.json({
      success: true,
      printers: printers.map(printer => ({
        name: printer.name,
        isDefault: printer.isDefault
      }))
    });
  } catch (error) {
    console.error('Error fetching printers:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch printers",
      message: error.message
    });
  }
};

/* ------------------------------------------------------------------
  PRINT CONTROLLER - WITH ENHANCED DEBUGGING
------------------------------------------------------------------ */
export const printDocument = async (req, res) => {
  console.log('=== PRINT REQUEST RECEIVED ===');
  
  let browser = null;
  
  try {
    const { 
      record, 
      paperSize = "A4", 
      colorMode = "color", 
      layout = "portrait",
      destination = "pdf",
      printerName = null
    } = req.body;

    console.log('Processing:', record?.number, 'Type:', record?.type, 'Destination:', destination);
    console.log('Printer name:', printerName);

    // ENHANCED DEBUGGING FOR ADDITIONAL INFO
    console.log('=== ADDITIONAL INFO DEBUG ===');
    console.log('Record keys:', Object.keys(record || {}));
    console.log('showAdditionalInfo:', record?.showAdditionalInfo);
    console.log('Type of showAdditionalInfo:', typeof record?.showAdditionalInfo);
    console.log('additionalInfo:', record?.additionalInfo);
    console.log('Type of additionalInfo:', typeof record?.additionalInfo);
    console.log('Should show additional info:', 
      record?.showAdditionalInfo === true && 
      record?.additionalInfo && 
      record?.additionalInfo.trim() !== ''
    );
    console.log('=== END DEBUG ===');

    if (!record) {
      console.log('ERROR: Record data missing');
      return res.status(400).json({ error: "Record data missing" });
    }

    // Build HTML
    const html = buildHtml(record, colorMode);
    console.log('HTML built successfully');
    
    // Save HTML for debugging
    const debugHtmlPath = path.join(process.cwd(), 'debug-output.html');
    await fs.writeFile(debugHtmlPath, html);
    console.log('Debug HTML saved to:', debugHtmlPath);

    // Launch browser
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu"
      ]
    });
    console.log('Browser launched');

    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 794, height: 1122 });
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Wait for content to load
    await page.setContent(html, { 
      waitUntil: ['load', 'domcontentloaded', 'networkidle0'] 
    });
    
    console.log('Page content set');

    // PDF options
    const pdfOptions = {
      path: TEMP_PDF,
      format: paperSize,
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
      preferCSSPageSize: true
    };

    if (layout === "landscape") {
      pdfOptions.landscape = true;
    }

    // Generate PDF
    console.log('Generating PDF...');
    await page.pdf(pdfOptions);
    console.log('PDF generated successfully');

    await browser.close();
    browser = null;

    if (destination === "printer") {
      console.log('Printing to printer:', printerName);
      
      try {
        if (!fs.existsSync(TEMP_PDF)) {
          throw new Error('Temporary PDF file not found');
        }

        const printOptions = printerName ? { printer: printerName } : {};
        console.log('Print options:', printOptions);
        
        await printer.print(TEMP_PDF, printOptions);
        console.log('Print job sent successfully');
        
        await fs.remove(TEMP_PDF);
        
        return res.json({ 
          success: true, 
          message: `Document sent to printer ${printerName || 'default'} successfully` 
        });
        
      } catch (printError) {
        console.error('PRINT ERROR:', printError);
        
        if (fs.existsSync(TEMP_PDF)) {
          await fs.remove(TEMP_PDF);
        }
        
        return res.status(500).json({ 
          error: "Print failed",
          message: printError.message,
          details: `Failed to print to ${printerName || 'default printer'}`
        });
      }
    } else {
      // Send PDF for download
      console.log('Sending PDF for download...');
      
      if (!fs.existsSync(TEMP_PDF)) {
        throw new Error('Generated PDF file not found');
      }

      const filename = `${record.number || 'document'}.pdf`;
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const fileStream = fs.createReadStream(TEMP_PDF);
      
      fileStream.pipe(res);
      
      fileStream.on("end", async () => {
        try {
          await fs.remove(TEMP_PDF);
          console.log('Temp file cleaned up');
        } catch (cleanupError) {
          console.warn('Cleanup warning:', cleanupError.message);
        }
      });

      fileStream.on("error", (streamError) => {
        console.error('Stream error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: "File stream error" });
        }
      });
    }

  } catch (err) {
    console.error('=== PDF GENERATION ERROR ===');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Browser close error:', closeError.message);
      }
    }
    
    try {
      if (fs.existsSync(TEMP_PDF)) {
        await fs.remove(TEMP_PDF);
      }
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError.message);
    }
    
    res.status(500).json({ 
      error: "PDF generation failed",
      message: err.message
    });
  }
};