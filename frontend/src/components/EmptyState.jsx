import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "./Button";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  actionLink,
  secondaryAction,
  secondaryLabel,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6"
        >
          <Icon className="w-10 h-10 text-muted-foreground" />
        </motion.div>
      )}
      
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-foreground mb-2"
      >
        {title}
      </motion.h3>
      
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground max-w-sm mb-6"
        >
          {description}
        </motion.p>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {action && actionLabel && (
          <Button onClick={action} variant="primary">
            {actionLabel}
          </Button>
        )}
        {actionLink && actionLabel && (
          <Link to={actionLink}>
            <Button variant="primary">{actionLabel}</Button>
          </Link>
        )}
        {secondaryAction && secondaryLabel && (
          <Button onClick={secondaryAction} variant="outline">
            {secondaryLabel}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}

export function Skeleton({ className = "", variant = "default" }) {
  const variants = {
    default: "rounded-xl",
    circular: "rounded-full",
    text: "rounded-md h-4",
  };

  return (
    <div
      className={`shimmer bg-muted ${variants[variant]} ${className}`}
    />
  );
}

export function SkeletonCard({ hasImage = false, lines = 3 }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {hasImage && (
        <Skeleton className="w-full h-40" />
      )}
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {[...Array(lines)].map((_, i) => (
          <Skeleton 
            key={i} 
            variant="text" 
            className={i === lines - 1 ? "w-2/3" : "w-full"} 
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
          <Skeleton variant="circular" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
          <Skeleton className="w-16 h-8" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <Skeleton variant="text" className="w-1/2" />
              <Skeleton className="w-3/4 h-8" />
            </div>
            <Skeleton variant="circular" className="w-10 h-10" />
          </div>
          <Skeleton variant="text" className="w-full mt-4" />
        </div>
      ))}
    </div>
  );
}
