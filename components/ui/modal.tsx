import React from "react";
import { cn } from "@/lib/utils/formatters";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}) => {
  if (!isOpen) return null;

  const maxW = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "2xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Dialog panel */}
        <div
          className={cn(
            "relative w-full transform rounded-2xl bg-white p-4 sm:p-6 text-left shadow-xl transition-all max-h-[90vh] flex flex-col",
            maxW[maxWidth]
          )}
        >
          <div className="flex items-center justify-between pb-3 mb-3 sm:mb-4 border-b border-slate-100 shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 pr-2">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-base leading-none"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto pr-1 flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
