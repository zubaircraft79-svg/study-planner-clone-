import { clsx } from "clsx";

export default function Badge({ children, color, className = "" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
        "bg-accent text-accent-foreground",
        className
      )}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </span>
  );
}
