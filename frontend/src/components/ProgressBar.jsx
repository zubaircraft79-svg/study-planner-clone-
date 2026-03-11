import { motion } from "framer-motion";

export default function ProgressBar({ 
  value = 0, 
  color, 
  showValue = false, 
  size = "md",
  animated = true,
  gradient = false,
  glow = false,
  className = "" 
}) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  const sizes = {
    xs: "h-1",
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
    xl: "h-4",
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`relative w-full ${sizes[size]} bg-muted rounded-full overflow-hidden`}>
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${glow ? 'shadow-glow-sm' : ''}`}
          style={{
            backgroundColor: color || 'hsl(var(--primary))',
            ...(gradient && {
              background: `linear-gradient(90deg, ${color || 'hsl(var(--primary))'}, hsl(var(--accent)))`,
            }),
          }}
          initial={animated ? { width: 0 } : { width: `${clampedValue}%` }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Shimmer effect */}
          {animated && clampedValue > 0 && (
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['200% 0', '-200% 0'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </motion.div>
      </div>
      {showValue && (
        <motion.span 
          className="text-xs text-muted-foreground mt-1 block text-right font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {clampedValue}%
        </motion.span>
      )}
    </div>
  );
}

export function MultiProgressBar({ segments = [], size = "md", className = "" }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  
  const sizes = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={`w-full ${sizes[size]} bg-muted rounded-full overflow-hidden flex ${className}`}>
      {segments.map((segment, index) => {
        const percentage = total > 0 ? (segment.value / total) * 100 : 0;
        return (
          <motion.div
            key={index}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: segment.color }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            title={`${segment.label}: ${segment.value}`}
          />
        );
      })}
    </div>
  );
}

export function ProgressRing({ 
  value = 0, 
  size = 80, 
  strokeWidth = 6,
  color,
  showValue = true,
  className = "" 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color || "hsl(var(--primary))"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {showValue && (
        <motion.span 
          className="absolute text-sm font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {clampedValue}%
        </motion.span>
      )}
    </div>
  );
}
