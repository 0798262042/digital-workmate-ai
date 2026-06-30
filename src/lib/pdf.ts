import jsPDF from "jspdf";

export function downloadTextAsPdf(filename: string, title: string, body: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, margin);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(body, maxWidth);
  let y = margin + 28;
  const pageH = doc.internal.pageSize.getHeight();
  for (const line of lines) {
    if (y > pageH - margin) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += 16;
  }
  doc.save(filename);
}

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}
