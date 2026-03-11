import { motion } from "framer-motion";

export default function SectionCard({ title, subtitle, children, actions, className = "" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}
    >
      <div className="p-5 pb-0 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}
