export function AdminHeader({ title, onMenu }) {
  return (
    <header className="admin-header">
      <h1>{title}</h1>
      <button type="button" className="btn btn--secondary sidebar-toggle" onClick={onMenu}>
        Menu
      </button>
    </header>
  );
}
