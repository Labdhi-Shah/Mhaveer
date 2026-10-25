import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Formats a currency amount into Indian Rupee format (e.g. "Rs. 25,00,000")
 */
function formatCurrency(val) {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
    return "N/A";
  }
  const num = Number(val);
  return "Rs. " + num.toLocaleString("en-IN");
}

/**
 * Formats date into readable string (e.g. "22 Oct 2026")
 */
function formatDate(dateVal) {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateVal);
  }
}

/**
 * Formats full date and time (e.g. "22 Oct 2026, 04:30 PM")
 */
function formatDateTime(dateVal) {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateVal);
  }
}

/**
 * Generates and downloads a clean, professional PDF for a single Meeting card
 * Restricted to Managers only in the UI.
 * 
 * @param {Object} meeting - The meeting object (with populated leadId, employeeId, salesAssignedTo)
 * @param {Object} currentUser - The logged in user generating the PDF
 */
export function generateMeetingPdf(meeting, currentUser) {
  if (!meeting) {
    throw new Error("No meeting data provided for PDF generation.");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryNavy = [22, 35, 53]; // #162335
  const accentPurple = [124, 58, 237]; // #7c3aed
  const textDark = [30, 41, 59]; // #1e293b
  const textMuted = [100, 116, 139]; // #64748b
  const lightBg = [248, 250, 252]; // #f8fafc
  const borderColor = [226, 232, 240]; // #e2e8f0

  // ──────────────────────────────────────────────────────────────────────────
  // 1. TOP HEADER BANNER
  // ──────────────────────────────────────────────────────────────────────────
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Accent line below header
  doc.setFillColor(accentPurple[0], accentPurple[1], accentPurple[2]);
  doc.rect(0, 28, pageWidth, 2, "F");

  // Company Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NOBLE FINANCE SERVICES", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text("OFFICIAL CLIENT MEETING & LEAD DOSSIER", margin, 18);
  doc.text("Internal Management Copy • Confidential", margin, 23);

  // Right Header Info: Ref ID & Generated Time
  const refId = meeting.leadId?.leadId 
    ? `LEAD: ${meeting.leadId.leadId}`
    : `MTG-${(meeting._id || "").slice(-6).toUpperCase()}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(refId, pageWidth - margin, 12, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${formatDateTime(new Date())}`, pageWidth - margin, 18, { align: "right" });
  
  const managerName = currentUser?.name || currentUser?.fullName || "Manager";
  doc.text(`Downloaded By: ${managerName}`, pageWidth - margin, 23, { align: "right" });

  let currentY = 36;

  // ──────────────────────────────────────────────────────────────────────────
  // 2. MEETING TITLE & STATUS OVERVIEW BOX
  // ──────────────────────────────────────────────────────────────────────────
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, currentY, contentWidth, 22, 3, 3, "FD");

  // Meeting Title
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const meetingTitle = meeting.title || "Client Meeting";
  doc.text(meetingTitle, margin + 4, currentY + 7);

  // Status Badge
  const status = (meeting.status || "Scheduled").toUpperCase();
  let badgeBg = [241, 245, 249]; // default slate
  let badgeText = [71, 85, 105];

  if (status === "COMPLETED") {
    badgeBg = [209, 250, 229]; // emerald-100
    badgeText = [6, 95, 70]; // emerald-800
  } else if (status === "SCHEDULED") {
    badgeBg = [237, 233, 254]; // purple-100
    badgeText = [109, 40, 217]; // purple-700
  } else if (status === "RESCHEDULED") {
    badgeBg = [254, 243, 199]; // amber-100
    badgeText = [146, 64, 14]; // amber-800
  } else if (status === "CANCELLED") {
    badgeBg = [254, 226, 226]; // rose-100
    badgeText = [153, 27, 27]; // rose-800
  }

  const badgeWidth = 28;
  const badgeHeight = 6;
  const badgeX = pageWidth - margin - badgeWidth - 4;
  const badgeY = currentY + 3;

  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  doc.text(status, badgeX + badgeWidth / 2, badgeY + 4.2, { align: "center" });

  // Schedule sub-row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  
  const meetingDateStr = formatDate(meeting.date);
  const meetingTimeStr = meeting.time || "N/A";
  const meetingTypeStr = meeting.type || "Consultation";
  const locationStr = meeting.location || (meeting.leadId ? `${meeting.leadId.city || ""}, ${meeting.leadId.state || ""}` : "Office / On-Site");

  doc.text(`Schedule: ${meetingDateStr} at ${meetingTimeStr}    |    Type: ${meetingTypeStr}    |    Location: ${locationStr}`, margin + 4, currentY + 16);

  currentY += 28;

  // ──────────────────────────────────────────────────────────────────────────
  // 3. CLIENT & COMPANY INFORMATION TABLE
  // ──────────────────────────────────────────────────────────────────────────
  const customerName = meeting.customerName || meeting.leadId?.contactPerson || meeting.leadId?.companyName || "N/A";
  const phone = meeting.leadId?.phoneNumber || meeting.customerPhone || "N/A";
  const companyName = meeting.leadId?.companyName || "N/A";
  const fullAddress = meeting.leadId?.address 
    ? `${meeting.leadId.address}, ${meeting.leadId.city || ""}, ${meeting.leadId.state || ""}`
    : locationStr;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: textDark,
      lineColor: borderColor,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: primaryNavy,
      fontStyle: "bold",
      fontSize: 9,
    },
    head: [
      [
        { content: "1. CLIENT & COMPANY DETAILS", colSpan: 4, styles: { halign: "left" } }
      ]
    ],
    body: [
      [
        { content: "Customer / Contact:", styles: { fontStyle: "bold", textColor: textMuted, width: 42 } },
        { content: customerName, styles: { fontStyle: "bold" } },
        { content: "Contact Number:", styles: { fontStyle: "bold", textColor: textMuted, width: 40 } },
        { content: phone },
      ],
      [
        { content: "Company Name:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: companyName },
        { content: "Lead ID:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: meeting.leadId?.leadId || "N/A" },
      ],
      [
        { content: "Location / Address:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: fullAddress, colSpan: 3 },
      ],
    ],
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // ──────────────────────────────────────────────────────────────────────────
  // 4. LOAN & FINANCIAL REQUIREMENTS TABLE
  // ──────────────────────────────────────────────────────────────────────────
  const lead = meeting.leadId || {};
  const loanAmt = lead.loanAmount !== undefined ? formatCurrency(lead.loanAmount) : "N/A";
  const turnover = lead.companyTurnover 
    ? formatCurrency(lead.companyTurnover)
    : lead.yearlyIncome 
      ? formatCurrency(lead.yearlyIncome)
      : "N/A";

  const loanType = lead.loanType || "N/A";
  const propertyCategory = lead.propertyLoanCategory || "N/A";
  const callStatus = lead.callStatus || "N/A";
  const interested = lead.interested || "N/A";

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: textDark,
      lineColor: borderColor,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: primaryNavy,
      fontStyle: "bold",
      fontSize: 9,
    },
    head: [
      [
        { content: "2. FINANCIAL & LOAN ASSESSMENT", colSpan: 4, styles: { halign: "left" } }
      ]
    ],
    body: [
      [
        { content: "Loan Amount Required:", styles: { fontStyle: "bold", textColor: textMuted, width: 42 } },
        { content: loanAmt, styles: { fontStyle: "bold", textColor: [5, 150, 105] } }, // emerald-600
        { content: "Loan Type:", styles: { fontStyle: "bold", textColor: textMuted, width: 40 } },
        { content: loanType },
      ],
      [
        { content: "Company Turnover / Income:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: turnover },
        { content: "Property Category:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: propertyCategory },
      ],
      [
        { content: "Interest Status:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: `${interested} (${callStatus})`, colSpan: 3 },
      ],
    ],
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // ──────────────────────────────────────────────────────────────────────────
  // 5. MEETING NOTES & AGENDA
  // ──────────────────────────────────────────────────────────────────────────
  const meetingNotes = (meeting.notes || "").trim() || "No additional meeting notes recorded.";

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: textDark,
      lineColor: borderColor,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: primaryNavy,
      fontStyle: "bold",
      fontSize: 9,
    },
    head: [
      [
        { content: "3. MEETING AGENDA & NOTES", styles: { halign: "left" } }
      ]
    ],
    body: [
      [
        { content: `"${meetingNotes}"`, styles: { fontStyle: "italic", textColor: [71, 85, 105] } }
      ]
    ],
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // ──────────────────────────────────────────────────────────────────────────
  // 6. PERSONNEL & AUDIT TRAIL
  // ──────────────────────────────────────────────────────────────────────────
  const creatorName =
    meeting.employeeId?.name ||
    meeting.employeeId?.fullName ||
    meeting.employeeName ||
    lead.employeeName ||
    "N/A";

  const creatorEmail =
    meeting.employeeId?.officialEmail ||
    lead.officialEmail ||
    "N/A";

  const creatorEmpId =
    meeting.employeeId?.employeeId ||
    lead.employeeId ||
    "N/A";

  const assignedSalesName =
    meeting.salesAssignedTo?.name ||
    meeting.salesAssignedTo?.fullName ||
    meeting.salesAssignedToName ||
    "Unassigned / Telecalling Pool";

  const department = meeting.department || "Telecalling";
  const createdAtStr = formatDateTime(meeting.createdAt);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: textDark,
      lineColor: borderColor,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: primaryNavy,
      fontStyle: "bold",
      fontSize: 9,
    },
    head: [
      [
        { content: "4. TEAM & AUDIT TRAIL", colSpan: 4, styles: { halign: "left" } }
      ]
    ],
    body: [
      [
        { content: "Created By (Employee):", styles: { fontStyle: "bold", textColor: textMuted, width: 42 } },
        { content: `${creatorName} [ID: ${creatorEmpId}]` },
        { content: "Assigned Sales Rep:", styles: { fontStyle: "bold", textColor: textMuted, width: 40 } },
        { content: assignedSalesName },
      ],
      [
        { content: "Employee Email:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: creatorEmail },
        { content: "Department:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: department },
      ],
      [
        { content: "Record Created At:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: createdAtStr },
        { content: "Manager Access Verified:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: `Yes (${managerName})` },
      ],
      [
        { content: "Client Met By (Person):", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: meeting.meetingPersonName || "Pending / N/A", styles: { fontStyle: meeting.meetingPersonName ? "bold" : "normal" } },
        { content: "Client Visit Notes:", styles: { fontStyle: "bold", textColor: textMuted } },
        { content: meeting.meetingPersonNotes || "N/A" },
      ],
    ],
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. FOOTER & COMPLIANCE NOTICE
  // ──────────────────────────────────────────────────────────────────────────
  const footerY = pageHeight - 16;
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    "NOBLE FINANCE SERVICES • STRICTLY CONFIDENTIAL • FOR AUTHORIZED MANAGERIAL USE ONLY",
    margin,
    footerY + 5
  );

  doc.text("Page 1 of 1", pageWidth - margin, footerY + 5, { align: "right" });

  doc.setFontSize(6.5);
  doc.text(
    "This document is automatically generated by Noble Finance CRM. Unauthorized distribution, copying or sharing is strictly prohibited.",
    margin,
    footerY + 9
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 8. SAVE / DOWNLOAD PDF
  // ──────────────────────────────────────────────────────────────────────────
  const safeName = (customerName || "Meeting")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 30);
  const dateStr = meeting.date ? meeting.date.split("T")[0] : "Record";
  const fileName = `Meeting_${safeName}_${dateStr}.pdf`;

  doc.save(fileName);
}
