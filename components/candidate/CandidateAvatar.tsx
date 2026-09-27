"use client";

import React, { useState } from "react";

interface CandidateAvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function CandidateAvatar({
  src,
  name,
  size = "md",
  className = "",
}: CandidateAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-2xl",
  }[size];

  const initial = name ? name.trim().charAt(0).toUpperCase() : "?";

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClasses} rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center shrink-0 shadow-xs ${className}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClasses} rounded-full object-cover border border-indigo-200 shrink-0 shadow-xs ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
