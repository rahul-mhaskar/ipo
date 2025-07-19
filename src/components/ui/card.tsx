// src/components/ui/card.tsx
import React from "react";

export function Card({ className = "", children, ...props }) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`text-gray-800 text-sm ${className}`} {...props}>
      {children}
    </div>
  );
}
