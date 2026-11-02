import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5 shadow-lg",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-[#7A1222] via-[#9B1B2F] to-[#7A1222] text-white hover:brightness-110 shadow-md shadow-[#7A1222]/30 border border-[#D4AF37]/30",
    gold:
      "bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#2F070E] font-semibold hover:brightness-105 shadow-md shadow-[#D4AF37]/20 border border-[#FFF1C5]",
    secondary:
      "bg-[#4A0E17]/80 text-[#fcf8f2] hover:bg-[#4A0E17] border border-[#D4AF37]/20",
    outline:
      "bg-transparent text-[#D4AF37] border border-[#D4AF37]/60 hover:bg-[#D4AF37]/10",
    danger:
      "bg-red-700/80 text-white hover:bg-red-600 border border-red-500/40",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Procesando...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
