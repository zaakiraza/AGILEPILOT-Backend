const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const cell = (value, type = "String") =>
  `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;

const row = (values) =>
  `<Row>${values.map((v) => cell(v)).join("")}</Row>`;

export const buildExcelXml = (sheetName, headers, dataRows) => {
  const headerRow = row(headers);
  const bodyRows = dataRows.map((r) => row(r)).join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table>
      ${headerRow}
      ${bodyRows}
    </Table>
  </Worksheet>
</Workbook>`;
};

export const buildMultiSheetExcelXml = (sheets) => {
  const worksheetXml = sheets
    .map(
      ({ name, headers, rows }) => `
  <Worksheet ss:Name="${escapeXml(name)}">
    <Table>
      ${row(headers)}
      ${rows.map((r) => row(r)).join("")}
    </Table>
  </Worksheet>`
    )
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${worksheetXml}
</Workbook>`;
};
