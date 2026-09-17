import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Portals to document.body so the overlay covers AppHeader + tab bar. */
export function FullScreenModal({
  visible,
  children,
}: {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
  animationType?: "none" | "slide" | "fade";
}) {
  useEffect(() => {
    if (!visible) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [visible]);

  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
