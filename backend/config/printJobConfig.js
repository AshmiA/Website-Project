export const PRINTER_NAME = process.env.PRINTER_NAME || ""; // e.g. "HP_LaserJet_1020" (exact OS printer name). If empty, printing is skipped and only PDF is returned.
export const PAPER_SIZE = process.env.PAPER_SIZE || "A4"; // A3, A4, A5, Letter, Legal
export const PDF_MARGIN_MM = { top: 6, bottom: 6, left: 6, right: 6 };
export const TEMP_DIR = process.env.TEMP_DIR || "./temp";
export const PREVIEW_CSS = "./assets/preview.css";
