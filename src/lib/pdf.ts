import jsPDF from "jspdf";

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function downloadTextAsPdf(filename: string, title: string, body: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title || "Untitled", maxWidth);
  doc.text(titleLines, margin, margin);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const bodyLines = doc.splitTextToSize(body || "", maxWidth);
  let y = margin + titleLines.length * 20 + 16;
  const pageHeight = doc.internal.pageSize.getHeight();
  for (const line of bodyLines) {
    if (y > pageHeight - margin) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += 16;
  }

  doc.save(filename);
}
