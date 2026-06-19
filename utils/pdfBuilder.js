const escapePdfText = (text) =>
  String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");

export const buildSimplePdf = (lines) => {
  const fontSize = 11;
  const lineHeight = 16;
  const startY = 780;
  const marginX = 50;

  const contentStreams = lines.map((line, index) => {
    const y = startY - index * lineHeight;
    const safe = escapePdfText(line);
    return `BT /F1 ${fontSize} Tf ${marginX} ${y} Td (${safe}) Tj ET`;
  });

  const streamContent = contentStreams.join("\n");
  const streamLength = Buffer.byteLength(streamContent, "utf8");

  const objects = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj");
  objects.push(
    `3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj`
  );
  objects.push(
    `4 0 obj<< /Length ${streamLength} >>stream\n${streamContent}\nendstream endobj`
  );
  objects.push(
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj"
  );

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${obj}\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= objects.length; i++) {
    const offset = String(offsets[i]).padStart(10, "0");
    pdf += `${offset} 00000 n \n`;
  }

  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};
