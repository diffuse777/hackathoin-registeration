const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const EVENT_NAME = 'QUANTEX SERIES MUGEN';

const PAGE_BORDER = 16;
const MARGIN = 28;
const BOTTOM_MARGIN = 48;
const BORDER_TOP = 50;
const LOGO_ROW_HEIGHT = 58;
const TITLE_HEIGHT = 26;
const ROW_HEIGHT = 18;
const TABLE_HEADER_HEIGHT = 20;

const LOGO_DIR = path.join(__dirname, '..', 'assets');
const LOGOS = {
  cybernerds: path.join(LOGO_DIR, 'logo-cybernerds.png'),
  owasp: path.join(LOGO_DIR, 'logo-owasp.png'),
  kare: path.join(LOGO_DIR, 'logo-kare.png'),
};

const PARTICIPANT_COLUMNS = [
  { key: 'sno', label: 'S.No', weight: 0.45 },
  { key: 'teamName', label: 'Team Name', weight: 1.15 },
  { key: 'name', label: 'Name', weight: 1.15 },
  { key: 'registerNumber', label: 'Register No', weight: 1.05 },
  { key: 'email', label: 'Email', weight: 1.45 },
  { key: 'section', label: 'Sec', weight: 0.45 },
  { key: 'amount', label: 'Amount', weight: 0.7 },
  { key: 'paidStatus', label: 'Paid Status', weight: 0.85 },
];

function formatGeneratedDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

function displayValue(value) {
  if (value == null || value === '') {
    return '-';
  }
  return String(value);
}

function formatAmount(amount) {
  return `INR ${amount}`;
}

function scaleColumns(contentWidth) {
  const totalWeight = PARTICIPANT_COLUMNS.reduce((sum, column) => sum + column.weight, 0);
  return PARTICIPANT_COLUMNS.map((column) => ({
    ...column,
    width: (column.weight / totalWeight) * contentWidth,
  }));
}

class RegistrationPdfReport {
  constructor(outputStream) {
    this.doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: BOTTOM_MARGIN },
      bufferPages: false,
      autoFirstPage: true,
      compress: true,
      info: {
        Title: EVENT_NAME,
        Author: 'Hackathon Registration System',
        Creator: 'Hackathon Registration System',
      },
    });

    this.pageNumber = 1;
    this.serial = 0;
    this.tableHeader = null;
    this.inPageAdded = false;
    this.contentWidth = this.doc.page.width - MARGIN * 2;
    this.columns = scaleColumns(this.contentWidth);
    this.finished = new Promise((resolve, reject) => {
      this.doc.on('end', resolve);
      this.doc.on('error', reject);
    });

    this.doc.on('pageAdded', () => this.onPageAdded());
    this.doc.pipe(outputStream);

    this.drawPageChrome();
    this.drawFooter();
    this.drawTableHeader();
    this.tableHeader = () => this.drawTableHeader();
  }

  pageBottom() {
    return this.doc.page.height - PAGE_BORDER - 30;
  }

  withYPreserved(draw) {
    const { x, y } = this.doc;
    draw();
    this.doc.x = x;
    this.doc.y = y;
  }

  writeLine(text, x, y, options = {}) {
    this.doc.text(text, x, y, {
      lineBreak: false,
      height: options.height || 12,
      ellipsis: true,
      ...options,
    });
  }

  drawImageIfPresent(filePath, x, y, options) {
    if (!fs.existsSync(filePath)) {
      return;
    }
    this.doc.image(filePath, x, y, options);
  }

  headerBottom() {
    return BORDER_TOP + TITLE_HEIGHT + 6;
  }

  drawPageBorder() {
    const { doc } = this;
    const x = PAGE_BORDER;
    const y = BORDER_TOP;
    const width = doc.page.width - PAGE_BORDER * 2;
    const height = doc.page.height - BORDER_TOP - PAGE_BORDER;
    doc.rect(x, y, width, height).strokeColor(BLACK).lineWidth(1.25).stroke();
    doc.rect(x + 3, y + 3, width - 6, height - 6).strokeColor(BLACK).lineWidth(0.6).stroke();
  }

  drawLogosOnTopBorder() {
    const { doc } = this;
    const leftX = MARGIN;
    const owaspX = MARGIN + 128;
    const kareX = doc.page.width - MARGIN - 54;

    doc.save();
    doc.rect(leftX - 6, 8, 250, 44).fill(WHITE);
    doc.rect(kareX - 8, 6, 70, 48).fill(WHITE);
    doc.restore();

    this.drawImageIfPresent(LOGOS.cybernerds, leftX, 10, { fit: [120, 42] });
    this.drawImageIfPresent(LOGOS.owasp, owaspX, 12, { fit: [110, 38] });
    this.drawImageIfPresent(LOGOS.kare, kareX, 8, { fit: [54, 50] });
  }

  drawPageChrome() {
    const { doc } = this;
    this.withYPreserved(() => {
      this.drawPageBorder();
      this.drawLogosOnTopBorder();

      doc.font('Helvetica-Bold').fontSize(16).fillColor(BLACK);
      this.writeLine(EVENT_NAME, MARGIN, BORDER_TOP + 10, {
        width: this.contentWidth,
        align: 'center',
        height: 20,
      });
    });
    doc.y = this.headerBottom() + 8;
  }

  onPageAdded() {
    if (this.inPageAdded) {
      return;
    }

    this.inPageAdded = true;
    try {
      this.pageNumber += 1;
      this.drawPageChrome();
      this.drawFooter();
      if (this.tableHeader) {
        this.tableHeader();
      }
    } finally {
      this.inPageAdded = false;
    }
  }

  ensureSpace(needed) {
    if (this.inPageAdded) {
      return;
    }
    if (this.doc.y + needed > this.pageBottom()) {
      this.doc.addPage();
    }
  }

  drawFooter() {
    this.withYPreserved(() => {
      const y = this.doc.page.height - PAGE_BORDER - 18;
      this.doc.font('Helvetica').fontSize(9).fillColor(BLACK);
      this.writeLine('ELECTRONICALLY GENERATED', MARGIN, y, {
        width: this.contentWidth,
        align: 'center',
        height: 12,
      });
    });
  }

  strokeGridRow(y, height) {
    const { doc } = this;
    doc.rect(MARGIN, y, this.contentWidth, height).strokeColor(BLACK).lineWidth(0.7).stroke();
    let x = MARGIN;
    this.columns.forEach((column, index) => {
      if (index > 0) {
        doc.moveTo(x, y).lineTo(x, y + height).strokeColor(BLACK).lineWidth(0.7).stroke();
      }
      x += column.width;
    });
  }

  drawTableHeader() {
    const { doc } = this;
    const y = doc.y;
    this.strokeGridRow(y, TABLE_HEADER_HEIGHT);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK);

    let x = MARGIN;
    this.columns.forEach((column) => {
      this.writeLine(column.label, x + 3, y + 5, {
        width: column.width - 6,
        height: 10,
      });
      x += column.width;
    });
    doc.y = y + TABLE_HEADER_HEIGHT;
  }

  drawRow(values) {
    const { doc } = this;
    this.ensureSpace(ROW_HEIGHT);
    const y = doc.y;
    this.strokeGridRow(y, ROW_HEIGHT);
    doc.font('Helvetica').fontSize(7.5).fillColor(BLACK);

    let x = MARGIN;
    this.columns.forEach((column) => {
      this.writeLine(displayValue(values[column.key]), x + 3, y + 4, {
        width: column.width - 6,
        height: 10,
      });
      x += column.width;
    });
    doc.y = y + ROW_HEIGHT;
  }

  writeTeam(team) {
    (team.members || []).forEach((member) => {
      this.serial += 1;
      this.drawRow({
        sno: this.serial,
        teamName: team.teamName,
        name: member.name,
        registerNumber: member.registerNumber,
        email: member.email,
        section: member.section,
        amount: formatAmount(team.totalAmount),
        paidStatus: team.paymentStatus,
      });
    });
  }

  writeEmpty() {
    this.ensureSpace(24);
    this.doc.font('Helvetica').fontSize(11).fillColor(BLACK);
    this.writeLine('No registrations match the selected filters.', MARGIN, this.doc.y, {
      width: this.contentWidth,
      height: 14,
    });
  }

  end() {
    this.tableHeader = null;
    this.doc.end();
    return this.finished;
  }

  destroy() {
    this.tableHeader = null;
    try {
      this.doc.end();
    } catch {
      // already closed
    }
  }
}

function createRegistrationPdfReport(outputStream) {
  return new RegistrationPdfReport(outputStream);
}

module.exports = {
  createRegistrationPdfReport,
  RegistrationPdfReport,
  PARTICIPANT_COLUMNS,
  EVENT_NAME,
  formatGeneratedDate,
};
