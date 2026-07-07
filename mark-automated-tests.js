const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const inputPath = '/Users/Paul.Bogdan@computacenter.com/Downloads/Report (27).xls';
const outputPath = '/Users/Paul.Bogdan@computacenter.com/Downloads/Report_Automated_Marked.xlsx';
const specDir = path.join(__dirname, 'tests');

function findAutomatedTestIds() {
  const ids = new Set();
  function walkDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'archived') walkDir(full);
      else if (entry.isFile() && entry.name.endsWith('.spec.js')) {
        const content = fs.readFileSync(full, 'utf8');
        for (const m of content.matchAll(/(?:Test\s*#?\s*|TC\s*#?\s*|test.*?)(\d{6})/gi)) {
          ids.add(m[1]);
        }
      }
    }
  }
  walkDir(specDir);
  return ids;
}

function cleanHtml(val) {
  let v = String(val || '');
  v = v.replace(/<html:[^>]*>/gi, '').replace(/<\/html:[^>]*>/gi, '');
  v = v.replace(/<Row>.*?<\/Row>/gs, ' ');
  v = v.replace(/<Cell>.*?<\/Cell>/gs, ' ');
  v = v.replace(/<Data[^>]*>/g, '').replace(/<\/Data>/g, '');
  v = v.replace(/<[^>]*>/g, '');
  v = v.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  v = v.replace(/\s+/g, ' ');
  return v.trim();
}

const automatedIds = findAutomatedTestIds();
console.log(`Found ${automatedIds.size} automated test IDs in spec files`);

const wb = XLSX.read(fs.readFileSync(inputPath), { type: 'buffer' });
const wsName = wb.SheetNames[0];
const ws = wb.Sheets[wsName];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

let headerRow = -1;
let testIdCol = 0;
let stepCol = 4;

for (let r = 0; r < Math.min(data.length, 20); r++) {
  const row = data[r];
  if (!row) continue;
  for (let c = 0; c < row.length; c++) {
    const val = cleanHtml(row[c]);
    if (val === 'Test #') { testIdCol = c; headerRow = r; }
    if (val === 'Test Step') stepCol = c;
  }
  if (headerRow >= 0) break;
}

console.log(`Header row: ${headerRow}, Test# col: ${testIdCol}, Step col: ${stepCol}`);

const automatedRowSet = new Set();
let currentTestAutomated = false;
let markedTests = 0;
let markedSteps = 0;

for (let r = headerRow + 1; r < data.length; r++) {
  const row = data[r];
  if (!row) continue;

  const testIdRaw = cleanHtml(row[testIdCol]);
  const stepRaw = String(row[stepCol] || '').trim();
  const idMatch = testIdRaw.match(/\b(\d{6})\b/);

  if (idMatch) {
    currentTestAutomated = automatedIds.has(idMatch[1]);
    if (currentTestAutomated) {
      automatedRowSet.add(r);
      markedTests++;
    }
    continue;
  }

  if (currentTestAutomated && /^\d+$/.test(stepRaw)) {
    automatedRowSet.add(r);
    markedSteps++;
  }
}

console.log(`Marked ${markedTests} test cases + ${markedSteps} step rows`);

async function writeExcel() {
  const outWb = new ExcelJS.Workbook();
  const outWs = outWb.addWorksheet('Report');

  const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } };
  const headerFont = { bold: true, name: 'Arial', size: 10 };
  const normalFont = { name: 'Arial', size: 10 };
  const greenFont = { bold: true, name: 'Arial', size: 10, color: { argb: 'FF006100' } };
  const thinBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };

  const colCount = data.reduce((max, row) => Math.max(max, row ? row.length : 0), 0);
  const automatedCol = colCount;

  for (let r = 0; r < data.length; r++) {
    const row = data[r] || [];
    const cleaned = row.map(cell => cleanHtml(cell));

    if (r === headerRow) {
      cleaned.push('Automated?');
    } else if (automatedRowSet.has(r)) {
      const stepRaw = String(row[stepCol] || '').trim();
      cleaned.push(/^\d+$/.test(stepRaw) ? 'YES (step)' : 'YES');
    } else {
      cleaned.push('');
    }

    const excelRow = outWs.addRow(cleaned);

    if (r === headerRow) {
      excelRow.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.border = thinBorder;
        cell.alignment = { vertical: 'center', wrapText: false };
      });
    } else if (r > headerRow) {
      const isAutomated = automatedRowSet.has(r);
      excelRow.eachCell({ includeEmpty: false }, (cell) => {
        cell.font = isAutomated ? greenFont : normalFont;
        cell.border = thinBorder;
        cell.alignment = { vertical: 'top', wrapText: true };
        if (isAutomated) {
          cell.fill = greenFill;
        }
      });

      if (isAutomated) {
        for (let c = 1; c <= automatedCol + 1; c++) {
          const cell = excelRow.getCell(c);
          cell.fill = greenFill;
          cell.font = greenFont;
          cell.border = thinBorder;
        }
      }
    }
  }

  outWs.getColumn(1).width = 10;
  outWs.getColumn(2).width = 55;
  outWs.getColumn(3).width = 70;
  outWs.getColumn(4).width = 12;
  outWs.getColumn(5).width = 10;
  outWs.getColumn(6).width = 70;
  outWs.getColumn(7).width = 55;
  outWs.getColumn(8).width = 40;
  outWs.getColumn(9).width = 12;
  for (let c = 10; c <= colCount; c++) {
    outWs.getColumn(c).width = 20;
  }
  outWs.getColumn(automatedCol + 1).width = 14;

  outWs.autoFilter = {
    from: { row: headerRow + 1, column: 1 },
    to: { row: data.length, column: automatedCol + 1 },
  };

  const summaryWs = outWb.addWorksheet('Automation Summary');
  const matchedInReport = [...automatedIds].filter(id => {
    return data.some(row => {
      const val = cleanHtml(row?.[testIdCol]);
      return val.includes(id);
    });
  }).sort();

  const titleRow = summaryWs.addRow(['AUTOMATION COVERAGE SUMMARY']);
  titleRow.font = { bold: true, size: 14 };
  summaryWs.addRow([`Generated: ${new Date().toISOString().split('T')[0]}`]);
  summaryWs.addRow([]);

  const metricHeader = summaryWs.addRow(['Metric', 'Count']);
  metricHeader.font = { bold: true };
  metricHeader.eachCell(c => { c.fill = headerFill; c.border = thinBorder; });

  const metrics = [
    ['Total automated test IDs in spec files', automatedIds.size],
    ['Test cases marked green in report', markedTests],
    ['Test steps marked green in report', markedSteps],
    ['Total rows highlighted', markedTests + markedSteps],
  ];
  for (const [label, val] of metrics) {
    const r = summaryWs.addRow([label, val]);
    r.eachCell(c => { c.border = thinBorder; });
  }

  summaryWs.addRow([]);
  const listHeader = summaryWs.addRow(['Automated Test IDs (matched in report)']);
  listHeader.font = { bold: true };
  for (const id of matchedInReport) {
    const r = summaryWs.addRow([id]);
    r.getCell(1).fill = greenFill;
  }

  summaryWs.getColumn(1).width = 50;
  summaryWs.getColumn(2).width = 12;

  await outWb.xlsx.writeFile(outputPath);
  console.log(`\nSaved to: ${outputPath}`);
}

writeExcel().catch(err => console.error(err));
