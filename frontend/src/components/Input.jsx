import { clsx } from "clsx";

export function Input({ label, hint, className = "", ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        className={clsx(
          "w-full h-10 px-3 rounded-lg border border-border bg-background",
          "text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-200",
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Select({ label, hint, children, className = "", ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <select
        className={clsx(
          "w-full h-10 px-3 rounded-lg border border-border bg-background",
          "text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-200",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Textarea({ label, hint, className = "", ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        className={clsx(
          "w-full px-3 py-2 rounded-lg border border-border bg-background",
          "text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-200 resize-none",
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
