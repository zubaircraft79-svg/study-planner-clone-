import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  success: "bg-success text-success-foreground hover:bg-success/90",
  outline: "border-2 border-border bg-transparent hover:bg-secondary text-foreground",
  ghost: "hover:bg-secondary text-foreground",
  gradient: "bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg hover:opacity-90",
  glow: "bg-primary text-primary-foreground shadow-glow hover:shadow-glow-lg",
};

const sizes = {
  xs: "h-7 px-2.5 text-xs gap-1",
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  xl: "h-14 px-8 text-lg gap-3",
};

const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  xl: "w-6 h-6",
};

const Button = forwardRef(function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = "left",
  fullWidth = false,
  type = "button",
  ...props
}, ref) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={clsx(
        "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={clsx(iconSizes[size], "animate-spin")} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className={iconSizes[size]} />}
          {children}
          {Icon && iconPosition === "right" && <Icon className={iconSizes[size]} />}
        </>
      )}
    </motion.button>
  );
});

export default Button;

export function IconButton({ 
  icon: Icon, 
  variant = "ghost", 
  size = "md",
  label,
  className = "",
  ...props 
}) {
  const btnVariants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground",
    outline: "border border-border bg-transparent hover:bg-secondary text-foreground",
  };

  const btnSizes = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconBtnSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        btnVariants[variant],
        btnSizes[size],
        className
      )}
      aria-label={label}
      {...props}
    >
      <Icon className={iconBtnSizes[size]} />
    </motion.button>
  );
}

export function ButtonGroup({ children, className = "" }) {
  return (
    <div className={clsx("inline-flex rounded-xl overflow-hidden border border-border", className)}>
      {children}
    </div>
  );
}

export function ButtonGroupItem({ children, active, className = "", ...props }) {
  return (
    <button
      className={clsx(
        "px-4 py-2 text-sm font-medium transition-colors border-r border-border last:border-r-0",
        active 
          ? "bg-primary text-primary-foreground" 
          : "bg-card hover:bg-secondary text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function FloatingActionButton({ icon: Icon, label, className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        "fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label={label}
      {...props}
    >
      <Icon className="w-6 h-6" />
    </motion.button>
  );
}
