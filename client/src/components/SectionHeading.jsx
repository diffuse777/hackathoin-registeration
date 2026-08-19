export function SectionHeading({ eyebrow, title, children, id }) {
  return (
    <header>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id}>{title}</h2>
      <div className="rule-line" aria-hidden="true">
        <span className="rule-line__diamond" />
      </div>
      {children}
    </header>
  );
}
