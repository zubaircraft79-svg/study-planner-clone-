export default function SectionCard({ title, subtitle, children, actions, className = "" }) {
  return (
    <section className={`card ${className}`.trim()}>
      <div className="section-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="actions">{actions}</div> : null}
      </div>
      <div className="section-content">
        {children}
      </div>
    </section>
  );
}