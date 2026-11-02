import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "crimson" | "success" | "muted";
  className?: string;
}

export function Badge({ children, variant = "gold", className = "" }: BadgeProps) {
  const variantStyles = {
    gold: "bg-[#D4AF37]/15 text-[#F3E5AB] border-[#D4AF37]/40 shadow-sm shadow-[#D4AF37]/10",
    crimson: "bg-[#7A1222]/30 text-[#FF9EAA] border-[#7A1222]/60",
    success: "bg-emerald-950/60 text-emerald-300 border-emerald-500/30",
    muted: "bg-stone-800/60 text-stone-300 border-stone-700/50",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
