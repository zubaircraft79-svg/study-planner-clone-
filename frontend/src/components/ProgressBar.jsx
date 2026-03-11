import { motion } from "framer-motion";

export default function ProgressBar({ value, color = "hsl(var(--primary))" }) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  return (
    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedValue}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
