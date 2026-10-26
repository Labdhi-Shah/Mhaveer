import * as XLSX from "xlsx";

/**
 * Safari & Cross-Browser Safe Blob Downloader
 * Prevents "WebKitBlobResource error 1" on Safari macOS / iOS / iPadOS
 *
 * @param {Blob} blob - The file Blob to download
 * @param {string} filename - Desired filename with extension
 */
export function downloadBlob(blob, filename) {
  if (!blob) return;

  // Legacy IE/Edge support
  if (typeof window !== "undefined" && window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, filename);
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  a.rel = "noopener noreferrer";

  // Critical for Safari on macOS: Element MUST be attached to document.body
  document.body.appendChild(a);

  // Trigger download click
  a.click();

  // Critical for Safari WebKit: Keep the blob URL valid in memory
  // while the native browser download stream initializes.
  // Immediate revocation causes WebKitBlobResource error 1 on Safari.
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Ignore cleanup error if already detached
    }
  }, 2500);
}

/**
 * Safari-Safe Excel XLSX Downloader
 * Replaces XLSX.writeFile which triggers tab navigation on Safari
 *
 * @param {Object} wb - XLSX Workbook object
 * @param {string} filename - Desired filename (.xlsx)
 */
export function downloadXLSX(wb, filename) {
  if (!wb) return;
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  downloadBlob(blob, filename);
}
