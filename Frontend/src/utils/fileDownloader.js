import * as XLSX from "xlsx";

/**
 * Sanitizes a filename to ensure it is valid across macOS, Windows, Linux, iOS, and Android.
 * Strips dangerous or illegal filesystem characters while preserving extension.
 *
 * @param {string} filename - Desired filename
 * @param {string} defaultName - Fallback if filename is empty
 * @returns {string} Sanitized safe filename
 */
export function sanitizeFilename(filename, defaultName = "download") {
  if (!filename || typeof filename !== "string") return defaultName;
  const clean = filename
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/[\x00-\x1f\x80-\x9f]/g, "")
    .trim();
  return clean || defaultName;
}

/**
 * Safari (macOS & iOS) & Cross-Browser Safe Blob Downloader.
 * 
 * Root Cause Resolution for macOS Safari "Safari Can't Open This Page":
 * 1. OMIT rel="noopener noreferrer": Setting rel="noreferrer" on a blob: URL in WebKit
 *    strips the document's security origin context. Since blob: URLs must resolve against
 *    their originating origin (e.g. https://mhaveer.vercel.app), WebKit fails the access
 *    check with "WebKitBlobResource error 1", navigates the current tab, and displays
 *    "Safari Can't Open This Page".
 * 2. OMIT target="_blank": Forcing a new tab on blob downloads causes Safari to navigate
 *    or trigger popup blockers rather than downloading silently to the user's Downloads folder.
 * 3. Element Layout Tree Inclusion: Styles the anchor off-screen with opacity 0 (instead of
 *    display: none) ensuring WebKit layout tree inclusion during event dispatch.
 * 4. Generous Revocation Timeout: Extends URL.revokeObjectURL to 60s so that native Safari
 *    user confirmation dialogs ("Do you want to allow downloads on [domain]?") and background
 *    streams have ample time to complete before memory is reclaimed.
 *
 * @param {Blob|ArrayBuffer|Uint8Array} blob - The file Blob or buffer to download
 * @param {string} filename - Desired filename with extension
 * @param {string} [mimeType] - Optional explicit MIME type override
 */
export function downloadBlob(blob, filename, mimeType) {
  if (!blob) {
    if (import.meta.env?.DEV) {
      console.warn("[FileDownloader] downloadBlob invoked with empty or null blob");
    }
    return;
  }

  const safeFilename = sanitizeFilename(filename, "download");

  // Legacy IE/Edge support
  if (typeof window !== "undefined" && window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, safeFilename);
    return;
  }

  // Ensure blob is an instance of Blob
  let targetBlob = blob;
  if (!(blob instanceof Blob)) {
    targetBlob = new Blob([blob], { type: mimeType || "application/octet-stream" });
  } else if (mimeType && targetBlob.type !== mimeType) {
    targetBlob = new Blob([targetBlob], { type: mimeType });
  }

  let objectUrl = null;
  try {
    objectUrl = window.URL.createObjectURL(targetBlob);
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn("[FileDownloader] URL.createObjectURL failed, falling back to FileReader:", err.message);
    }
  }

  if (objectUrl) {
    const a = document.createElement("a");
    // Ensure element is part of layout tree without affecting page visual presentation
    a.style.position = "fixed";
    a.style.top = "-9999px";
    a.style.left = "-9999px";
    a.style.width = "1px";
    a.style.height = "1px";
    a.style.opacity = "0";
    a.style.pointerEvents = "none";

    a.href = objectUrl;
    a.download = safeFilename;

    // CRITICAL: Do NOT set a.rel = "noopener noreferrer" or a.target = "_blank"!
    // WebKit requires origin context to resolve blob: URLs.

    document.body.appendChild(a);

    try {
      if (typeof MouseEvent === "function") {
        const evt = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        a.dispatchEvent(evt);
      } else {
        a.click();
      }
    } catch (clickErr) {
      if (import.meta.env?.DEV) {
        console.warn("[FileDownloader] dispatchEvent failed, attempting a.click():", clickErr.message);
      }
      a.click();
    } finally {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }

    // 60-second delayed revocation prevents "WebKitBlobResource error 1" when
    // Safari displays download permission prompt ("Do you want to allow downloads on...")
    const cleanup = () => {
      try {
        window.URL.revokeObjectURL(objectUrl);
      } catch (e) {
        // Cleanup error ignored
      }
    };

    const timerId = setTimeout(cleanup, 60000);

    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener(
        "pagehide",
        () => {
          clearTimeout(timerId);
          cleanup();
        },
        { once: true }
      );
    }
    return;
  }

  // Fallback: FileReader data URL for environments where createObjectURL is restricted
  try {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const fallbackA = document.createElement("a");
      fallbackA.style.position = "fixed";
      fallbackA.style.top = "-9999px";
      fallbackA.style.left = "-9999px";
      fallbackA.style.opacity = "0";
      fallbackA.href = dataUrl;
      fallbackA.download = safeFilename;
      document.body.appendChild(fallbackA);
      fallbackA.click();
      setTimeout(() => {
        if (document.body.contains(fallbackA)) {
          document.body.removeChild(fallbackA);
        }
      }, 1000);
    };
    reader.readAsDataURL(targetBlob);
  } catch (readerErr) {
    console.error("[FileDownloader] Fallback download failed:", readerErr.message);
  }
}

/**
 * Safari & Cross-Browser Safe Excel XLSX Downloader.
 * Replaces XLSX.writeFile to prevent unwanted tab navigation on Safari macOS/iOS.
 *
 * @param {Object} wb - XLSX Workbook object
 * @param {string} filename - Desired filename (.xlsx)
 */
export function downloadXLSX(wb, filename) {
  if (!wb) {
    if (import.meta.env?.DEV) {
      console.warn("[FileDownloader] downloadXLSX called without workbook");
    }
    return;
  }
  const cleanFilename = filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  downloadBlob(blob, cleanFilename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

/**
 * Safari & Cross-Browser Safe CSV Downloader.
 * Automatically injects UTF-8 BOM so Excel on macOS & Windows correctly displays Unicode text.
 *
 * @param {string} csvString - CSV formatted text content
 * @param {string} filename - Desired filename (.csv)
 */
export function downloadCSV(csvString, filename) {
  if (csvString === null || csvString === undefined) {
    if (import.meta.env?.DEV) {
      console.warn("[FileDownloader] downloadCSV called with null content");
    }
    return;
  }
  const cleanFilename = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
  const blob = new Blob(["\uFEFF" + csvString], {
    type: "text/csv;charset=utf-8;"
  });
  downloadBlob(blob, cleanFilename, "text/csv;charset=utf-8;");
}
