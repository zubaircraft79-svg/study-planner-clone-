export default function SectionCard({ title, subtitle, children, actions }) {
  return (
    <section className="card">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}