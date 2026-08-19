const CSV_COLUMNS = Object.freeze([
  'Team Name',
  'Member Count',
  'Participant Name',
  'Register Number',
  'Department',
  'Section',
  'Phone',
  'Email',
  'Student Type',
  'Hostel Name',
  'Room Number',
  'Total Team Amount',
  'Payment Status',
  'Created Date',
]);

function escapeCsvValue(value) {
  if (value == null) {
    return '';
  }

  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsvRow(values) {
  return `${values.map(escapeCsvValue).join(',')}\r\n`;
}

function csvHeaderRow() {
  return toCsvRow(CSV_COLUMNS);
}

module.exports = {
  CSV_COLUMNS,
  escapeCsvValue,
  toCsvRow,
  csvHeaderRow,
};
