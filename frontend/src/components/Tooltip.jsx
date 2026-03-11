import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export default function Tooltip({ 
  children, 
  content, 
  position = "top",
  delay = 200,
  className = "" 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  const positions = {
    top: { x: "calc(-50% + 0px)", y: "calc(-100% - 8px)" },
    bottom: { x: "calc(-50% + 0px)", y: "calc(0% + 8px)" },
    left: { x: "calc(-100% - 8px)", y: "calc(-50% + 0px)" },
    right: { x: "calc(0% + 8px)", y: "calc(-50% + 0px)" },
  };

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let x, y;
        
        switch (position) {
          case "top":
            x = rect.left + rect.width / 2;
            y = rect.top;
            break;
          case "bottom":
            x = rect.left + rect.width / 2;
            y = rect.bottom;
            break;
          case "left":
            x = rect.left;
            y = rect.top + rect.height / 2;
            break;
          case "right":
            x = rect.right;
            y = rect.top + rect.height / 2;
            break;
          default:
            x = rect.left + rect.width / 2;
            y = rect.top;
        }
        
        setCoords({ x, y });
        setIsVisible(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
      >
        {children}
      </span>
      
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && content && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: coords.x,
                top: coords.y,
                transform: `translate(${positions[position].x}, ${positions[position].y})`,
                zIndex: 9999,
              }}
              className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium shadow-lg whitespace-nowrap"
            >
              {content}
              {/* Arrow */}
              <div 
                className={`absolute w-2 h-2 bg-foreground rotate-45 ${
                  position === "top" ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" :
                  position === "bottom" ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" :
                  position === "left" ? "right-0 top-1/2 -translate-y-1/2 translate-x-1/2" :
                  "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2"
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export function InfoTooltip({ content }) {
  return (
    <Tooltip content={content}>
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground text-2xs cursor-help">
        ?
      </span>
    </Tooltip>
  );
}
