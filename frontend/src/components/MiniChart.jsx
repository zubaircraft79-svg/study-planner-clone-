import { motion } from "framer-motion";
import { useMemo } from "react";

export function SparklineChart({ data = [], color = "hsl(var(--primary))", height = 40, className = "" }) {
  const { path, area, points } = useMemo(() => {
    if (!data.length) return { path: "", area: "", points: [] };
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 100;
    const h = height;
    const padding = 2;
    
    const pts = data.map((value, i) => ({
      x: (i / (data.length - 1)) * width,
      y: h - padding - ((value - min) / range) * (h - padding * 2),
    }));
    
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${width} ${h} L 0 ${h} Z`;
    
    return { path: pathD, area: areaD, points: pts };
  }, [data, height]);

  if (!data.length) return null;

  return (
    <svg 
      viewBox={`0 0 100 ${height}`} 
      className={`w-full overflow-visible ${className}`}
      preserveAspectRatio="none"
    >
      {/* Gradient fill */}
      <defs>
        <linearGradient id="sparklineGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <motion.path
        d={area}
        fill="url(#sparklineGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Line */}
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      
      {/* End point */}
      {points.length > 0 && (
        <motion.circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        />
      )}
    </svg>
  );
}

export function BarChart({ data = [], height = 60, className = "" }) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className={`flex items-end gap-1 ${className}`} style={{ height }}>
      {data.map((item, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{ 
            backgroundColor: item.color || "hsl(var(--primary))",
            minWidth: 8,
          }}
          initial={{ height: 0 }}
          animate={{ height: `${(item.value / max) * 100}%` }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          title={`${item.label || ''}: ${item.value}`}
        />
      ))}
    </div>
  );
}

export function DonutChart({ 
  value, 
  total, 
  size = 100, 
  strokeWidth = 12, 
  color = "hsl(var(--primary))",
  bgColor = "hsl(var(--muted))",
  children,
  className = "" 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="progress-ring -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

export function WeekHeatmap({ data = [], className = "" }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className={`grid grid-cols-7 gap-1 ${className}`}>
      {days.map((day, i) => {
        const dayData = data.find(d => d.day === i) || { value: 0 };
        const intensity = dayData.value / max;
        
        return (
          <motion.div
            key={day}
            className="aspect-square rounded-md flex items-center justify-center text-2xs font-medium"
            style={{
              backgroundColor: `hsl(var(--primary) / ${Math.max(0.1, intensity)})`,
              color: intensity > 0.5 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            title={`${day}: ${dayData.value} min`}
          >
            {day[0]}
          </motion.div>
        );
      })}
    </div>
  );
}

export default SparklineChart;
