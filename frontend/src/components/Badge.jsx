import { clsx } from "clsx";
import { motion } from "framer-motion";

const variants = {
  default: "bg-secondary text-secondary-foreground",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  outline: "bg-transparent border-border text-foreground",
};

const sizes = {
  sm: "px-2 py-0.5 text-2xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export default function Badge({ 
  children, 
  color, 
  variant = "default",
  size = "md",
  animated = false,
  removable = false,
  onRemove,
  icon: Icon,
  className = "" 
}) {
  const Component = animated ? motion.span : 'span';
  const animationProps = animated ? {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  } : {};

  // If color is provided, use custom styling
  const customStyle = color ? {
    backgroundColor: `${color}15`,
    color: color,
    borderColor: `${color}30`,
  } : {};

  return (
    <Component
      {...animationProps}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-medium border",
        !color && variants[variant],
        sizes[size],
        "transition-all duration-200",
        className
      )}
      style={color ? customStyle : {}}
    >
      {color && !Icon && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span className="truncate">{children}</span>
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </Component>
  );
}

export function BadgeGroup({ children, className = "" }) {
  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  );
}

export function StatusBadge({ status, className = "" }) {
  const statusConfig = {
    active: { variant: "success", label: "Active" },
    inactive: { variant: "default", label: "Inactive" },
    pending: { variant: "warning", label: "Pending" },
    completed: { variant: "primary", label: "Completed" },
    error: { variant: "destructive", label: "Error" },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge variant={config.variant} size="sm" className={className}>
      <span className="relative flex h-2 w-2">
        <span className={clsx(
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          status === "active" && "bg-success",
          status === "pending" && "bg-warning",
          status === "error" && "bg-destructive"
        )} />
        <span className={clsx(
          "relative inline-flex rounded-full h-2 w-2",
          status === "active" && "bg-success",
          status === "inactive" && "bg-muted-foreground",
          status === "pending" && "bg-warning",
          status === "completed" && "bg-primary",
          status === "error" && "bg-destructive"
        )} />
      </span>
      {config.label}
    </Badge>
  );
}
