import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { SparklineChart } from "./MiniChart";

export default function StatCard({ 
  label, 
  value, 
  hint, 
  icon: Icon, 
  index = 0,
  trend,
  trendValue,
  sparklineData,
  color,
  isNumeric = false,
  suffix = "",
  prefix = ""
}) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === "up") return <TrendingUp className="w-3.5 h-3.5" />;
    if (trend === "down") return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-success bg-success/10";
    if (trend === "down") return "text-destructive bg-destructive/10";
    return "text-muted-foreground bg-muted";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group bg-card border border-border rounded-2xl p-5 hover:shadow-soft-lg hover:border-primary/20 transition-all duration-300 overflow-hidden"
    >
      {/* Subtle gradient background on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      </div>

      <div className="relative">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
          </div>
          {Icon && (
            <motion.div 
              className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Icon className="w-5 h-5" />
            </motion.div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2 mb-2">
          {isNumeric ? (
            <AnimatedCounter 
              value={Number(value)} 
              prefix={prefix}
              suffix={suffix}
              className="text-3xl font-bold text-foreground tracking-tight"
            />
          ) : (
            <span className="text-3xl font-bold text-foreground tracking-tight truncate">
              {prefix}{value}{suffix}
            </span>
          )}
          
          {trend && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTrendColor()}`}
            >
              {getTrendIcon()}
              {trendValue}
            </motion.span>
          )}
        </div>

        {/* Hint */}
        {hint && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {hint}
          </p>
        )}

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 -mx-1">
            <SparklineChart 
              data={sparklineData} 
              height={32} 
              color={color || "hsl(var(--primary))"}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
