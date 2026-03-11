import { motion } from "framer-motion";

export default function StatCard({ label, value, hint, icon: Icon, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          {hint}
        </p>
      )}
    </motion.div>
  );
}
