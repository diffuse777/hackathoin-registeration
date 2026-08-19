export function ExportButtons({ onCsv, onPdf, busy }) {
  return (
    <div id="exports" className="register-form__bar">
      <button type="button" className="btn btn--secondary" onClick={onCsv} disabled={Boolean(busy)}>
        {busy === 'csv' ? 'Preparing CSV…' : 'Export CSV'}
      </button>
      <button type="button" className="btn btn--secondary" onClick={onPdf} disabled={Boolean(busy)}>
        {busy === 'pdf' ? 'Generating PDF…' : 'Export PDF'}
      </button>
    </div>
  );
}
