// src/components/ui/card.tsx
import React from "react";
import { cn } from "@/lib/utils"; // if you have a utility like clsx

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm text-gray-700", className)} {...props}>
      {children}
    </div>
  );
}
